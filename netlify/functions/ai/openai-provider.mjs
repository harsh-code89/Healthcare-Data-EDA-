/**
 * OpenAI Provider Integration for CareOS AI.
 * Handles secondary / fallback AI orchestration using the official OpenAI API & SDK.
 */

import OpenAI from "openai";
import { SYSTEM_PROMPT, sanitizeMessage } from "./safety-system.mjs";
import { classifyError, FailureCategory } from "./types-and-errors.mjs";

const DEFAULT_OPENAI_MODELS = {
  standard: "gpt-4o-mini",
  complex: "gpt-4o",
};

/**
 * Returns eligible OpenAI model based on query complexity and environment preference.
 */
export function getEligibleOpenAIModel(complexity = "standard") {
  const customPreference = process.env.OPENAI_MODEL_PREFERENCE;
  if (customPreference && customPreference !== "auto") {
    return customPreference;
  }
  return DEFAULT_OPENAI_MODELS[complexity] || "gpt-4o-mini";
}

/**
 * Executes a health assistance inquiry using OpenAI.
 */
export async function executeOpenAI(apiKey, messages, contextBlock, complexity = "standard") {
  if (!apiKey) {
    return {
      success: false,
      provider: "openai",
      category: FailureCategory.AUTH_FAILURE,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const model = getEligibleOpenAIModel(complexity);

  try {
    const client = new OpenAI({
      apiKey: apiKey.trim(),
      timeout: parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) || 45000,
    });

    // Format messages for OpenAI Chat Completions API
    const formattedMessages = [
      {
        role: "system",
        content: SYSTEM_PROMPT + contextBlock,
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: sanitizeMessage(m.content),
      })),
    ];

    const response = await client.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const choice = response.choices?.[0];
    const text = choice?.message?.content || "";

    if (!text) {
      return {
        success: false,
        provider: "openai",
        model,
        category: FailureCategory.SERVER_ERROR,
        error: "OpenAI returned an empty response",
      };
    }

    return {
      success: true,
      provider: "openai",
      model,
      text,
      usage: response.usage || null,
    };
  } catch (err) {
    const status = err.status || (err.response?.status) || 0;
    const category = classifyError(status, err.message);

    console.warn(`[OpenAI] Call failed with ${category} (${status}):`, err.message);

    return {
      success: false,
      provider: "openai",
      model,
      category,
      error: err.message,
    };
  }
}
