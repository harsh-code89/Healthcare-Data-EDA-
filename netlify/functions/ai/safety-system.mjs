/**
 * Shared Medical Safety, Clinical Evidence Standards, and Response Validation.
 * Applies identically across Google Gemini and OpenAI.
 */

export const SYSTEM_PROMPT = `You are CareOS AI — an advanced AI-powered health intelligence, pharmacology research, preventive health, and longevity analysis assistant built into the CareOS platform, a digital health record system for India.

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

/**
 * Sanitizes single message text to safe bounds.
 */
export function sanitizeMessage(text) {
  if (typeof text !== "string") return "";
  return text.trim().substring(0, 8000);
}

/**
 * Builds user health context block from authenticated patient records.
 */
export function buildContextBlock(userContext) {
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

/**
 * Builds a unified conversational prompt for completions APIs.
 */
export function buildUnifiedPrompt(messages, contextBlock) {
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

/**
 * Assesses complexity of user inquiry to choose reasoning tier (Pro vs Flash).
 */
export function assessComplexity(messages) {
  if (!messages || messages.length === 0) return "standard";
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";

  // Complex clinical keywords
  const complexKeywords = [
    "interaction", "contraindication", "mechanism of action", "pharmacokinetics",
    "clinical trial", "phase 3", "senolytics", "longevity protocol",
    "oncology", "chemotherapy", "immunosuppressant", "multiple medications",
    "ecg interpretation", "blood panel analysis", "differential diagnosis"
  ];

  const isComplex = complexKeywords.some((kw) => lastMsg.includes(kw)) || lastMsg.length > 400;
  return isComplex ? "complex" : "standard";
}

/**
 * Deterministic validation of AI-generated responses regardless of provider.
 */
export function validateResponse(text) {
  if (!text || typeof text !== "string") {
    return { isValid: false, reason: "EMPTY_RESPONSE" };
  }

  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return { isValid: false, reason: "RESPONSE_TOO_SHORT" };
  }

  // Check for common truncation indicators
  if (trimmed.endsWith("...") || trimmed.endsWith("and then") || trimmed.endsWith("specifically,")) {
    // Soft warning, still valid if long enough
  }

  return { isValid: true, cleanedText: trimmed };
}
