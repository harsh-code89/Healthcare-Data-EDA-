/**
 * Netlify Function: ai-health-chat
 * CareOS AI — Resilient Health Intelligence Agent powered by Google Gemini.
 *
 * POST /api/ai-health-chat
 * Body: { messages: [{role, content}], userContext?: {...} }
 *
 * Production Resilience:
 *   - Dynamic Model Discovery via Google ListModels API:
 *     Instead of relying on fragile hardcoded model names that get deprecated,
 *     it queries the API key's available models at runtime and auto-selects the
 *     best active Flash model.
 *   - In-memory model caching across warm lambda invocations.
 *   - Automatic fallback to system prompt message injection if systemInstruction
 *     is not supported by an older model tier.
 *   - User-friendly error diagnostics for invalid keys or quota limits.
 *   - GEMINI_API_KEY is protected server-side, never exposed to client.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Cache the discovered model in warm serverless instances
let cachedModelInfo = null;

// Fallback model names if ListModels is ever unreachable
const FALLBACK_MODELS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash",
  "models/gemini-2.0-flash-exp",
  "models/gemini-flash-latest",
  "models/gemini-1.5-flash-latest",
  "models/gemini-1.5-flash-002",
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro-latest",
  "models/gemini-pro-latest",
];

// ── CareOS AI System Prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are CareOS AI — an advanced AI-powered health intelligence, pharmacology research, preventive health, and longevity analysis assistant built into the CareOS platform, a digital health record system for India.

Your purpose is to help users understand their health, explore scientific advances, evaluate medicines and interventions, and make better-informed decisions in collaboration with qualified healthcare professionals.

## Your Knowledge Scope

**General health:** Human physiology, nutrition, sleep, exercise, mental well-being, metabolic health, cardiovascular health, immunity, and preventive care.
**Pharmacology:** Prescription medicines, OTC medicines, vaccines, biologics, hormones, antibiotics, supplements, peptides, gene therapies, and other therapeutic categories.
**Longevity science:** Biological aging, healthspan, cellular senescence, mitochondrial function, epigenetics, autophagy, stem-cell research, regenerative medicine, and age-related diseases.
**Experimental medicine:** Investigational drugs, clinical trials, discontinued candidates, preclinical discoveries, and publicly documented early-stage research.
**Indian pharmaceutical context:** CDSCO approvals, Indian pharmacy regulations, availability in India, generic vs brand, ABDM ecosystem.
**Personalized health education:** Explain how age, medical history, current medications, allergies, and lifestyle affect the applicability of medical information.

## Evidence Classification System

For every medicine, compound, or health intervention, clearly distinguish:
1. ✅ **Approved** — Regulatory approval for specified indication (state jurisdiction)
2. 🔬 **Post-marketing / Real-world evidence** — Observational studies after approval
3. 🧪 **Clinical trials** — Phase I / II / III human trials
4. 👤 **Early human research** — Human data without established approval
5. 🐭 **Animal studies** — Efficacy or safety from animal models only
6. 🔬 **In vitro / Lab only** — Cell culture or lab experiments only
7. 💭 **Hypothesis / Theoretical** — Proposed mechanism, preliminary
8. ❌ **Discontinued / Withdrawn** — Abandoned development
9. ❓ **Unclear / Unverified** — Insufficient data to classify

CRITICAL: Never state that an intervention is safe or effective in humans based solely on animal or lab evidence.

## Communication Guidelines

- Structure responses cleanly using Markdown headers (##), bold terms, and bulleted lists.
- When comparing options or clinical trial phases, use clear markdown tables.
- Clearly separate "Established Clinical Evidence" from "Emerging / Preclinical Evidence".
- For acute symptoms (such as high fever, sudden chest pain, shortness of breath), recommend evaluating warning signs that warrant immediate clinical attention.
- Provide Indian emergency guidance when relevant (Emergency: 112, AIIMS Poison Control Helpline: 1800-11-6117).
- Tone: Empathetic, precise, intellectually honest, scientifically literate, accessible.`;

function sanitizeMessage(text) {
  if (typeof text !== "string") return "";
  return text.trim().substring(0, 8000);
}

// ── Discover available models dynamically ──────────────────────────────────
async function getAvailableModel(apiKey) {
  if (cachedModelInfo) {
    return cachedModelInfo;
  }

  const cleanKey = apiKey.trim();
  
  // Try querying ListModels on v1beta, then v1
  for (const apiVersion of ["v1beta", "v1"]) {
    try {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${cleanKey}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "x-goog-api-key": cleanKey },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`ListModels on ${apiVersion} returned ${res.status}:`, errText.substring(0, 200));
        
        let parsed = null;
        try { parsed = JSON.parse(errText); } catch {}
        if (parsed?.error?.message?.toLowerCase().includes("api key not valid")) {
          throw new Error("API_KEY_INVALID");
        }
        continue;
      }

      const data = await res.json();
      const models = data.models || [];
      const contentModels = models.filter((m) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      if (contentModels.length > 0) {
        // Preferred order:
        // 1. Flash 2.x or 3.x models
        // 2. Any Flash model
        // 3. Pro models
        // 4. Any generateContent model
        const flashNew = contentModels.find(
          (m) => m.name.includes("flash") && (m.name.includes("2.") || m.name.includes("3."))
        );
        const flashAny = contentModels.find((m) => m.name.includes("flash"));
        const proModel = contentModels.find((m) => m.name.includes("pro"));
        const chosen = flashNew || flashAny || proModel || contentModels[0];

        cachedModelInfo = {
          apiVersion,
          modelPath: chosen.name, // e.g. "models/gemini-2.0-flash" or "models/gemini-2.5-flash"
        };
        console.log(`Discovered active Gemini model via ListModels: ${cachedModelInfo.modelPath} (${apiVersion})`);
        return cachedModelInfo;
      }
    } catch (err) {
      if (err.message === "API_KEY_INVALID") throw err;
      console.warn(`Exception during ListModels on ${apiVersion}:`, err?.message);
    }
  }

  // Fallback to first verified candidate if ListModels returned empty
  return {
    apiVersion: "v1beta",
    modelPath: FALLBACK_MODELS[0],
  };
}

// ── Build User Context Block ───────────────────────────────────────────────
function buildContextBlock(userContext) {
  if (!userContext || Object.keys(userContext).length === 0) return "";
  const parts = [];
  if (userContext.name) parts.push(`Patient name: ${userContext.name}`);
  if (userContext.medications?.length > 0) {
    parts.push(`Current medications: ${userContext.medications.join(", ")}`);
  }
  if (userContext.conditions?.length > 0) {
    parts.push(`Known conditions: ${userContext.conditions.join(", ")}`);
  }
  if (userContext.upcomingAppointments?.length > 0) {
    parts.push(`Upcoming appointments: ${userContext.upcomingAppointments.join(", ")}`);
  }
  if (userContext.recentReports?.length > 0) {
    parts.push(`Recent reports: ${userContext.recentReports.join(", ")}`);
  }
  return parts.length > 0
    ? `\n\n[User's CareOS Health Context — use for context but do not share raw data back verbatim]\n${parts.join("\n")}`
    : "";
}

// ── Call Gemini API with automatic payload fallback ────────────────────────
async function callGemini(apiVersion, modelPath, apiKey, messages, contextBlock) {
  const cleanKey = apiKey.trim();
  // Ensure modelPath starts with models/ or clean format
  const formattedModel = modelPath.startsWith("models/") ? modelPath : `models/${modelPath}`;
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/${formattedModel}:generateContent?key=${cleanKey}`;

  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: sanitizeMessage(msg.content) }],
  }));

  // Strategy 1: Modern REST payload with systemInstruction
  const payloadWithSystem = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT + contextBlock }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  };

  let res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": cleanKey,
    },
    body: JSON.stringify(payloadWithSystem),
  });

  // If 400 Bad Request (e.g. systemInstruction rejected on older tier), fallback to prepended system prompt
  if (res.status === 400) {
    console.warn(`Model ${modelPath} rejected systemInstruction; retrying with prepended context...`);
    const fallbackContents = [...contents];
    if (fallbackContents.length > 0 && fallbackContents[0].role === "user") {
      fallbackContents[0] = {
        role: "user",
        parts: [
          { text: `[System Instructions: ${SYSTEM_PROMPT + contextBlock}]\n\n${fallbackContents[0].parts[0].text}` },
        ],
      };
    }

    const payloadFallback = {
      contents: fallbackContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": cleanKey,
      },
      body: JSON.stringify(payloadFallback),
    });
  }

  return res;
}

// ── Main Netlify Handler ───────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "AI service not configured",
        message:
          "The GEMINI_API_KEY environment variable is not configured in Netlify. Please add it under Site configuration → Environment variables.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, userContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages must be a non-empty array" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const trimmedMessages = messages.slice(-20);
  const contextBlock = buildContextBlock(userContext || {});

  // 1. Discover model dynamically
  let modelInfo;
  try {
    modelInfo = await getAvailableModel(GEMINI_API_KEY);
  } catch (err) {
    if (err.message === "API_KEY_INVALID") {
      return new Response(
        JSON.stringify({
          error: "invalid_key",
          message:
            "Your Google Gemini API key appears to be invalid. Please verify and update GEMINI_API_KEY in your Netlify dashboard.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    modelInfo = { apiVersion: "v1beta", modelPath: FALLBACK_MODELS[0] };
  }

  // 2. Execute generation with discovered model
  try {
    let res = await callGemini(
      modelInfo.apiVersion,
      modelInfo.modelPath,
      GEMINI_API_KEY,
      trimmedMessages,
      contextBlock
    );

    // If 404 (model deprecated or unavailable), try each fallback model
    if (res.status === 404) {
      console.warn(`Discovered model ${modelInfo.modelPath} returned 404. Attempting fallbacks...`);
      cachedModelInfo = null; // Invalidate cache

      for (const fallback of FALLBACK_MODELS) {
        if (fallback === modelInfo.modelPath) continue;
        res = await callGemini("v1beta", fallback, GEMINI_API_KEY, trimmedMessages, contextBlock);
        if (res.ok) {
          cachedModelInfo = { apiVersion: "v1beta", modelPath: fallback };
          break;
        }
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini call failed (${res.status}):`, errText.substring(0, 300));

      let parsed = null;
      try { parsed = JSON.parse(errText); } catch {}

      const reason = parsed?.error?.details?.[0]?.reason || "";
      const msg = parsed?.error?.message || "";

      if (reason === "API_KEY_INVALID" || msg.toLowerCase().includes("api key not valid")) {
        return new Response(
          JSON.stringify({
            error: "invalid_key",
            message: "Your Gemini API key appears to be invalid. Please verify your GEMINI_API_KEY in Netlify.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      if (res.status === 429 || reason === "RESOURCE_EXHAUSTED") {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: "The AI service is temporarily busy (rate limit). Please wait a moment and try again.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "ai_error",
          message: msg || "The AI service encountered an issue. Please try again.",
        }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await res.json();
    const candidate = geminiData.candidates?.[0];

    if (!candidate) {
      return new Response(
        JSON.stringify({
          error: "no_response",
          message: "The AI did not generate a response. Please try rephrasing your question.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    if (candidate.finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({
          error: "safety_block",
          message: "Your message triggered medical safety guidelines. Please rephrase your question.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseText = candidate.content?.parts?.map((p) => p.text).join("") || "";
    if (!responseText) {
      return new Response(
        JSON.stringify({
          error: "empty_response",
          message: "The AI returned an empty response. Please try again.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        model: cachedModelInfo?.modelPath || modelInfo.modelPath,
        usage: geminiData.usageMetadata || null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (err) {
    console.error("Unexpected error in ai-health-chat:", err);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred while communicating with the AI. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
