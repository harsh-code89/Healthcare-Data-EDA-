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
 *   - Rate limiting awareness via response headers.
 *   - No PII is logged.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash"; // Fast, capable, free-tier eligible

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
- For prescription drugs: explain uses and risks but emphasize they require a qualified prescriber.

**Tone:** Precise, intellectually honest, scientifically literate, accessible. Define specialist terms. Direct about uncertainty — never hide gaps behind confident language.

## Response Format for Medicine Research

For substantial medicine evaluations, use this structure:
1. **Identity** — Generic name, drug class, mechanism
2. **Status in India** — CDSCO approval status, availability, prescription requirement
3. **International status** — FDA/EMA/WHO status
4. **Evidence level** — Use the classification system above
5. **Potential benefits** — Established vs. experimental, clearly separated
6. **Safety profile** — Common adverse effects, serious risks, contraindications, interactions
7. **Independent use assessment** — What could happen without medical supervision
8. **Better alternatives** — Established options for the same goal
9. **Practical conclusion** — What is known, unknown, and what action is reasonable

## Personal Health Context

When a user shares their health context (medications, conditions, test results from their CareOS records), use it to make explanations more relevant. Always remind them to confirm specifics with their doctor.

## Current limitations
- You do not have real-time internet access. Your knowledge has a training cutoff. For the most current drug approvals or trial results, recommend checking ClinicalTrials.gov, PubMed, or the CDSCO website directly.
- You cannot access the user's actual medical records unless they are explicitly shared in the conversation.
- Do not invent or hallucinate specific clinical trial numbers, study results, or drug approval dates.`;

// ── Input sanitization ─────────────────────────────────────────────────────
function sanitizeMessage(text) {
  if (typeof text !== "string") return "";
  return text.trim().substring(0, 8000); // Cap individual message length
}

// ── Build Gemini API payload ───────────────────────────────────────────────
function buildGeminiPayload(messages, userContext) {
  // Build context injection from user's health data
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

  // Build the contents array for Gemini
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: sanitizeMessage(msg.content) }],
  }));

  return {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT + contextBlock }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: "text/plain",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
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
    console.error("GEMINI_API_KEY is not configured");
    return new Response(
      JSON.stringify({
        error: "AI service not configured",
        message:
          "The GEMINI_API_KEY environment variable is not set. Please configure it in your Netlify dashboard.",
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

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages must be a non-empty array" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Limit conversation history length (last 20 messages max)
  const trimmedMessages = messages.slice(-20);

  // Validate each message
  for (const msg of trimmedMessages) {
    if (!["user", "assistant"].includes(msg.role) || typeof msg.content !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  try {
    const payload = buildGeminiPayload(trimmedMessages, userContext || {});

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errBody.substring(0, 500));

      // Handle quota exceeded specifically
      if (geminiRes.status === 429) {
        return new Response(
          JSON.stringify({
            error: "rate_limited",
            message: "The AI service is temporarily busy. Please wait a moment and try again.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "ai_error",
          message: "The AI service returned an error. Please try again.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();

    // Extract text from Gemini response
    const candidate = geminiData.candidates?.[0];
    if (!candidate) {
      return new Response(
        JSON.stringify({
          error: "no_response",
          message: "The AI did not return a response. Please try rephrasing your question.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle safety blocks
    if (candidate.finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({
          error: "safety_block",
          message:
            "Your message was flagged by safety filters. Please rephrase your question.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseText =
      candidate.content?.parts?.map((p) => p.text).join("") || "";

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
        model: MODEL,
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
    console.error("Unexpected error in ai-health-chat:", err?.message || err);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
