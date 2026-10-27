/**
 * Gemini Provider Integration for CareOS AI.
 * Handles dynamic model selection, Interactions API & generateContent API,
 * in-model fallbacks, and error classification.
 */

import { SYSTEM_PROMPT, sanitizeMessage, buildUnifiedPrompt } from "./safety-system.mjs";
import { classifyError, FailureCategory } from "./types-and-errors.mjs";

const DEFAULT_MODELS = {
  standard: ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.8-pro"],
  complex: ["gemini-3.8-pro", "gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-pro"],
};

const API_REVISION = "2026-05-20";

// In-memory cache for live discovered models
let modelRegistryCache = {
  models: null,
  timestamp: 0,
};

const CACHE_TTL_MS = (parseInt(process.env.AI_MODEL_DISCOVERY_TTL_SECONDS, 10) || 3600) * 1000;

/**
 * Discovers accessible Gemini models for the configured credentials.
 */
export async function discoverGeminiModels(apiKey) {
  if (!apiKey) return [];
  const now = Date.now();
  if (modelRegistryCache.models && (now - modelRegistryCache.timestamp < CACHE_TTL_MS)) {
    return modelRegistryCache.models;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "x-goog-api-key": apiKey.trim() },
    });

    if (!res.ok) {
      console.warn(`[Gemini Registry] Discovery returned ${res.status}`);
      return modelRegistryCache.models || DEFAULT_MODELS.standard;
    }

    const data = await res.json();
    const active = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""));

    if (active.length > 0) {
      modelRegistryCache = { models: active, timestamp: now };
      console.log(`[Gemini Registry] Discovered ${active.length} active models`);
      return active;
    }
  } catch (err) {
    console.warn(`[Gemini Registry] Discovery error: ${err.message}`);
  }

  return modelRegistryCache.models || DEFAULT_MODELS.standard;
}

/**
 * Selects candidate Gemini models in order of suitability.
 */
export function getEligibleGeminiModels(complexity = "standard") {
  const customPreference = process.env.GEMINI_MODEL_PREFERENCE;
  if (customPreference && customPreference !== "auto") {
    return [customPreference, ...DEFAULT_MODELS[complexity]];
  }
  return DEFAULT_MODELS[complexity];
}

/**
 * Executes a request against Google Interactions API.
 */
async function callInteractions(model, apiKey, promptText) {
  const url = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey.trim(),
      "Api-Revision": API_REVISION,
    },
    body: JSON.stringify({
      model,
      input: promptText,
    }),
  });

  return res;
}

/**
 * Executes a request against Google generateContent API.
 */
async function callGenerateContent(model, apiKey, messages, contextBlock) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: sanitizeMessage(m.content) }],
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey.trim(),
      "Api-Revision": API_REVISION,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + contextBlock }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  return res;
}

/**
 * Extracts generated text from either Interactions or generateContent response.
 */
function extractText(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.output_text) return data.output_text;
  if (data.outputText) return data.outputText;
  if (data.output?.text) return data.output.text;
  if (data.interaction?.output_text) return data.interaction.output_text;
  if (data.candidates?.[0]?.content?.parts) {
    return data.candidates[0].content.parts.map((p) => p.text).join("");
  }
  if (Array.isArray(data) && data[0]?.output_text) return data[0].output_text;
  if (data.text) return data.text;
  return "";
}

/**
 * Primary Gemini invocation with automatic Gemini-to-Gemini model failover.
 */
export async function executeGemini(apiKey, messages, contextBlock, complexity = "standard") {
  if (!apiKey) {
    return {
      success: false,
      category: FailureCategory.AUTH_FAILURE,
      error: "GEMINI_API_KEY is not configured",
    };
  }

  const candidateModels = getEligibleGeminiModels(complexity);
  const promptText = buildUnifiedPrompt(messages, contextBlock);
  let lastFailure = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const isFallbackModel = i > 0;

    try {
      // 1. Try Interactions API first
      let res = await callInteractions(model, apiKey, promptText);

      // 2. If Interactions API returned 404 or 400, try generateContent
      if (!res.ok && (res.status === 404 || res.status === 400)) {
        res = await callGenerateContent(model, apiKey, messages, contextBlock);
      }

      if (res.ok) {
        const data = await res.json();
        const text = extractText(data);
        if (text) {
          return {
            success: true,
            provider: "gemini",
            model,
            text,
            isModelFallback: isFallbackModel,
            attempts: i + 1,
          };
        }
      }

      const errText = await res.text();
      const category = classifyError(res.status, errText);
      lastFailure = { status: res.status, category, message: errText, model };

      console.warn(`[Gemini] Model ${model} failed with ${category} (${res.status}): ${errText.substring(0, 150)}`);

      // If it's HIGH_DEMAND (503) or MODEL_UNAVAILABLE (404), try next Gemini model!
      if (category === FailureCategory.HIGH_DEMAND || category === FailureCategory.MODEL_UNAVAILABLE) {
        continue; // Try next candidate Gemini model
      }

      // If AUTH_FAILURE, don't bother trying other Gemini models (key is bad for all)
      if (category === FailureCategory.AUTH_FAILURE) {
        break;
      }

      // If RATE_LIMIT or QUOTA_EXHAUSTED, trying other models may also fail, but try one more if available
      if (category === FailureCategory.RATE_LIMIT && i === 0) {
        continue;
      }
      break;
    } catch (err) {
      console.warn(`[Gemini] Network error on model ${model}:`, err.message);
      lastFailure = { status: 0, category: FailureCategory.TIMEOUT, message: err.message, model };
    }
  }

  return {
    success: false,
    provider: "gemini",
    category: lastFailure?.category || FailureCategory.UNKNOWN,
    error: lastFailure?.message || "All Gemini candidate models failed",
    model: lastFailure?.model || candidateModels[0],
    attempts: candidateModels.length,
  };
}
