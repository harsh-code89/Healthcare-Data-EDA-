/**
 * Netlify Function: ai-health-chat
 * CareOS AI — Health Intelligence Agent powered by Google Gemini (gemini-3.8-flash).
 *
 * Implements Google's official Interactions API & generateContent API with gemini-3.8-flash
 * per Google AI Studio 2026 specifications.
 *
 * POST /api/ai-health-chat
 * Body: { messages: [{role, content}], userContext?: {...} }
 * or:   { ping: true }
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-3.8-flash";
const API_REVISION = "2026-05-20";

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

// ── Build Single Prompt String for Interactions API ────────────────────────
function buildInteractionsPrompt(messages, contextBlock) {
  let prompt = `[SYSTEM INSTRUCTIONS]\n${SYSTEM_PROMPT}${contextBlock}\n\n`;

  if (messages.length > 1) {
    prompt += `[PREVIOUS CONVERSATION]\n`;
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      const speaker = msg.role === "assistant" ? "CareOS AI" : "User";
      prompt += `${speaker}: ${sanitizeMessage(msg.content)}\n\n`;
    }
  }

  const lastMessage = messages[messages.length - 1];
  prompt += `[CURRENT USER QUERY]\nUser: ${sanitizeMessage(lastMessage.content)}\n\nCareOS AI:`;
  return prompt;
}

// ── Fetch with Automatic Exponential Backoff on 429 ────────────────────────
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    
    if (res.status === 429 && attempt < maxRetries) {
      const waitMs = (attempt + 1) * 2000;
      console.warn(`Gemini 429 rate limit hit. Waiting ${waitMs}ms before retry ${attempt + 1}...`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    
    return res;
  }
}

// ── Engine 1: Google Interactions API (Official 2026 Recommended) ──────────
async function callInteractionsAPI(apiKey, promptText) {
  const cleanKey = apiKey.trim();
  const url = "https://generativelanguage.googleapis.com/v1beta/interactions";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": cleanKey,
      "Api-Revision": API_REVISION,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      input: promptText,
    }),
  };

  return await fetchWithRetry(url, options);
}

// ── Engine 2: Google generateContent API (gemini-3.8-flash fallback) ────────
async function callGenerateContentAPI(apiKey, messages, contextBlock) {
  const cleanKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${cleanKey}`;

  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: sanitizeMessage(msg.content) }],
  }));

  const payload = {
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

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": cleanKey,
      "Api-Revision": API_REVISION,
    },
    body: JSON.stringify(payload),
  };

  let res = await fetchWithRetry(url, options);

  // If 400 Bad Request on systemInstruction, fallback to prepended context
  if (res.status === 400) {
    const fallbackContents = [...contents];
    if (fallbackContents.length > 0 && fallbackContents[0].role === "user") {
      fallbackContents[0] = {
        role: "user",
        parts: [
          { text: `[System Instructions: ${SYSTEM_PROMPT + contextBlock}]\n\n${fallbackContents[0].parts[0].text}` },
        ],
      };
    }

    res = await fetchWithRetry(url, {
      ...options,
      body: JSON.stringify({
        contents: fallbackContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });
  }

  return res;
}

// ── Extract Text from Any Gemini API Response ───────────────────────────────
function extractResponseText(data) {
  if (!data) return "";
  if (typeof data === "string") return data;

  // Interactions API response formats
  if (data.output_text) return data.output_text;
  if (data.outputText) return data.outputText;
  if (data.output?.text) return data.output.text;
  if (data.interaction?.output_text) return data.interaction.output_text;
  if (data.interaction?.outputText) return data.interaction.outputText;

  // generateContent API response format
  if (data.candidates?.[0]?.content?.parts) {
    return data.candidates[0].content.parts.map((p) => p.text).join("");
  }

  // Array format
  if (Array.isArray(data) && data[0]?.output_text) {
    return data[0].output_text;
  }
  if (data.text) return data.text;

  return "";
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

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        configured: !!GEMINI_API_KEY,
        status: "ok",
        model: MODEL_NAME,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Instant zero-quota configuration check
  if (body?.ping) {
    return new Response(
      JSON.stringify({
        configured: !!GEMINI_API_KEY,
        status: "ok",
        model: MODEL_NAME,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
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

  const { messages, userContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages must be a non-empty array" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const trimmedMessages = messages.slice(-20);
  const contextBlock = buildContextBlock(userContext || {});
  const interactionsPrompt = buildInteractionsPrompt(trimmedMessages, contextBlock);

  try {
    let res;
    let engineUsed = "interactions";

    // 1. Try Google Interactions API (Primary 2026 Recommended)
    res = await callInteractionsAPI(GEMINI_API_KEY, interactionsPrompt);

    // 2. Fallback to generateContent API if Interactions API fails with 404 or 400
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      console.warn(`Interactions API returned ${res.status}. Falling back to generateContent API...`);
      engineUsed = "generateContent";
      res = await callGenerateContentAPI(GEMINI_API_KEY, trimmedMessages, contextBlock);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini call failed (${res.status}):`, errText.substring(0, 300));

      let parsed = null;
      try { parsed = JSON.parse(errText); } catch {}
      if (Array.isArray(parsed) && parsed[0]) parsed = parsed[0];

      const reason = parsed?.error?.details?.[0]?.reason || "";
      const msg = parsed?.error?.message || "";

      if (reason === "API_KEY_INVALID" || msg.toLowerCase().includes("api key not valid")) {
        return new Response(
          JSON.stringify({
            error: "invalid_key",
            message: "Your Gemini API key appears to be invalid. Please check your GEMINI_API_KEY in your Netlify Environment Variables.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      if (res.status === 429 || reason === "RESOURCE_EXHAUSTED" || msg.toLowerCase().includes("quota")) {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: "Google AI rate limit reached (15 queries/min on free tier). Please wait 30 seconds and click 'Retry question'.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "ai_error",
          message: msg || "The AI service encountered an issue. Please try again in a moment.",
        }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const resData = await res.json();
    const responseText = extractResponseText(resData);

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
        model: MODEL_NAME,
        engine: engineUsed,
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
