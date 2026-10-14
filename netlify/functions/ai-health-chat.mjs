/**
 * Netlify Function: ai-health-chat
 * CareOS AI — Health Intelligence Agent powered by Google Gemini.
 *
 * POST /api/ai-health-chat
 * Body: { messages: [{role, content}], userContext?: {...} }
 *
 * Security:
 *   - GEMINI_API_KEY is server-side only, never exposed to the client.
 *   - User messages are validated and length-limited.
 *   - Automatic model fallback (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash).
 *   - Clean error reporting to identify configuration or quota issues.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Candidate models in preference order (supports new and existing Gemini tiers)
const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
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

For every medicine or compound, clearly identify which stage of evidence applies:
1. ✅ **Approved** — Regulatory approval for a specific indication (state which country/authority)
2. 🔬 **Post-marketing / Real-world evidence** — Studies after approval
3. 🧪 **Clinical trials** — Phase I / II / III human trials (specify phase)
4. 👤 **Early human research** — Human data, no established approval
5. 🐭 **Animal studies** — Efficacy or safety from animal models only
6. 🔬 **In vitro / Lab only** — Cell culture or lab experiments only
7. 💭 **Hypothesis / Theoretical** — Proposed mechanism, insufficient evidence
8. ❌ **Discontinued / Withdrawn** — Abandoned development, state reason
9. ❓ **Unclear / Unverified** — Insufficient information to classify

CRITICAL: Never state that something is safe or effective in humans based solely on animal evidence.

## Communication Rules

**Structure your responses clearly:**
- Use headers (##) to organize complex responses
- Use tables for comparisons (medicines, countries, evidence stages)
- Use bullet points for lists of effects or benefits
- Bold key terms
- Separate "Established Evidence" from "Emerging Evidence" from "Preclinical Only"

**Labeling:**
- 📌 **Established:** Supported by multiple high-quality human trials or guidelines
- 🌱 **Emerging:** Supported by preliminary human evidence
- 🐭 **Preclinical only:** Animal or lab data, no confirmed human benefit
- 💭 **Hypothesis:** Proposed mechanism, theoretical
- ⚠️ **Caution:** Significant safety concern or uncertain risk
- 🇮🇳 **India context:** Specific to Indian availability, regulation, or relevance

**Safety boundaries:**
- You are a health intelligence and research assistant, NOT a replacement for a licensed clinician.
- Clearly label all information as educational and not individualized medical advice.
- NEVER guarantee safety, efficacy, or longevity benefits.
- NEVER recommend specific treatment regimens, dose changes, or stopping prescription medicines.
- NEVER fabricate citations, trial IDs, drug approvals, or research results.
- Recognize emergency symptoms and provide emergency guidance (India: 112, AIIMS Poison helpline: 1800-11-6117).
- For acute symptoms (like sudden high fever, chest pain, shortness of breath), recommend evaluating warning signs that warrant immediate clinical attention.

**Tone:** Precise, intellectually honest, scientifically literate, accessible. Define specialist terms. Direct about uncertainty.`;

// ── Input sanitization ─────────────────────────────────────────────────────
function sanitizeMessage(text) {
  if (typeof text !== "string") return "";
  return text.trim().substring(0, 8000);
}

// ── Build Gemini API payload (Strict REST schema compliance) ────────────────
function buildGeminiPayload(messages, userContext) {
  let contextBlock = "";
  if (userContext && Object.keys(userContext).length > 0) {
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
    if (parts.length > 0) {
      contextBlock = `\n\n[User's CareOS Health Context — use for context but do not share raw data back verbatim]\n${parts.join("\n")}`;
    }
  }

  // Build the contents array
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: sanitizeMessage(msg.content) }],
  }));

  // Note: REST API strictly expects camelCase systemInstruction
  return {
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
}

// ── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req, context) {
  // CORS preflight
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
    console.error("GEMINI_API_KEY is not configured in Netlify");
    return new Response(
      JSON.stringify({
        error: "AI service not configured",
        message:
          "The GEMINI_API_KEY environment variable is missing. Please add it in your Netlify dashboard under Site configuration → Environment variables.",
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
  for (const msg of trimmedMessages) {
    if (!["user", "assistant"].includes(msg.role) || typeof msg.content !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const payload = buildGeminiPayload(trimmedMessages, userContext || {});
  let lastErrorText = "";
  let lastStatus = 502;

  // Try candidate models in order of priority (automatic fallback)
  for (const model of CANDIDATE_MODELS) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY.trim()}`;

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY.trim(),
        },
        body: JSON.stringify(payload),
      });

      if (!geminiRes.ok) {
        lastStatus = geminiRes.status;
        lastErrorText = await geminiRes.text();
        console.warn(`Model ${model} returned ${geminiRes.status}:`, lastErrorText.substring(0, 300));
        
        // If 404 (model deprecated or not available in region), try next model in loop
        if (geminiRes.status === 404) {
          continue;
        }

        // Parse error details from Google API
        let parsed = null;
        try { parsed = JSON.parse(lastErrorText); } catch {}
        
        const apiErrorReason = parsed?.error?.details?.[0]?.reason || "";
        const apiErrorMessage = parsed?.error?.message || "";

        if (apiErrorReason === "API_KEY_INVALID" || apiErrorMessage.toLowerCase().includes("api key not valid")) {
          return new Response(
            JSON.stringify({
              error: "invalid_key",
              message: "Your Gemini API key appears to be invalid. Please check and re-enter your GEMINI_API_KEY in your Netlify dashboard.",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        if (geminiRes.status === 429 || apiErrorReason === "RESOURCE_EXHAUSTED") {
          return new Response(
            JSON.stringify({
              error: "rate_limited",
              message: "The AI service is temporarily busy (quota limit). Please wait 30 seconds and try again.",
            }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          );
        }

        // If it's a 400 bad request, try next model or format fallback
        if (geminiRes.status === 400 && model !== CANDIDATE_MODELS[CANDIDATE_MODELS.length - 1]) {
          continue;
        }

        return new Response(
          JSON.stringify({
            error: "ai_error",
            message: apiErrorMessage || "The AI service encountered an issue. Please try again.",
          }),
          { status: geminiRes.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const geminiData = await geminiRes.json();
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
            message: "Your inquiry triggered safety guidelines. Please rephrase your medical question.",
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
          model,
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
      console.warn(`Fetch error for model ${model}:`, err?.message);
      lastErrorText = err?.message || "Network error";
    }
  }

  // All models failed
  return new Response(
    JSON.stringify({
      error: "ai_unavailable",
      message: `Failed to connect to AI service: ${lastErrorText.substring(0, 200) || "Connection error"}. Please check your Netlify logs.`,
    }),
    { status: lastStatus || 502, headers: { "Content-Type": "application/json" } }
  );
}
