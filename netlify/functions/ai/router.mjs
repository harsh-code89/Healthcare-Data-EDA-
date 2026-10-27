/**
 * Centralized Multi-Provider AI Router & Circuit Breaker.
 * Seamlessly orchestrates Gemini (Primary) and OpenAI (Secondary Fallback),
 * automatically recovering back to Gemini when available.
 */

import { executeGemini } from "./gemini-provider.mjs";
import { executeOpenAI } from "./openai-provider.mjs";
import { assessComplexity, validateResponse } from "./safety-system.mjs";
import { FailureCategory, logTelemetry } from "./types-and-errors.mjs";

const CircuitState = {
  CLOSED: "CLOSED",       // Normal: Gemini healthy, routing to Gemini
  OPEN: "OPEN",           // Gemini failing: routing directly to OpenAI
  HALF_OPEN: "HALF_OPEN", // Cooldown passed: probing Gemini recovery
};

// In-memory circuit breaker state across warm lambda invocations
let circuit = {
  state: CircuitState.CLOSED,
  failureCount: 0,
  lastFailureTime: 0,
  lastFailureCategory: null,
};

const FAILURE_THRESHOLD = 2;
const COOLDOWN_MS = parseInt(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS, 10) || 45000; // 45s cooldown

/**
 * Gets current circuit breaker diagnostics.
 */
export function getCircuitStatus() {
  const now = Date.now();
  if (circuit.state === CircuitState.OPEN && now - circuit.lastFailureTime > COOLDOWN_MS) {
    circuit.state = CircuitState.HALF_OPEN;
  }
  return {
    state: circuit.state,
    failureCount: circuit.failureCount,
    lastFailureTime: circuit.lastFailureTime,
    lastFailureCategory: circuit.lastFailureCategory,
  };
}

/**
 * Resets circuit breaker to healthy state.
 */
export function resetCircuit() {
  circuit.state = CircuitState.CLOSED;
  circuit.failureCount = 0;
  circuit.lastFailureTime = 0;
  circuit.lastFailureCategory = null;
}

/**
 * Testing hook to manipulate circuit breaker state.
 */
export function _setCircuitStateForTesting(state, lastFailureTime = Date.now()) {
  circuit.state = state;
  circuit.lastFailureTime = lastFailureTime;
}

/**
 * Records a Gemini failure and trips circuit if threshold exceeded.
 */
function recordGeminiFailure(category) {
  circuit.failureCount++;
  circuit.lastFailureTime = Date.now();
  circuit.lastFailureCategory = category;

  if (circuit.failureCount >= FAILURE_THRESHOLD || category === FailureCategory.HIGH_DEMAND || category === FailureCategory.QUOTA_EXHAUSTED) {
    circuit.state = CircuitState.OPEN;
    console.log(`[Circuit Breaker] Gemini circuit OPENED due to ${category}. Routing to OpenAI.`);
  }
}

/**
 * Records a Gemini success and restores normal state.
 */
function recordGeminiSuccess() {
  if (circuit.state === CircuitState.HALF_OPEN) {
    console.log("[Circuit Breaker] Gemini probe succeeded! Recovered and circuit CLOSED.");
  }
  circuit.state = CircuitState.CLOSED;
  circuit.failureCount = 0;
  circuit.lastFailureCategory = null;
}

/**
 * Main AI Orchestration Router.
 */
export async function routeHealthInquiry({
  geminiKey,
  openaiKey,
  messages,
  contextBlock,
  correlationId,
}) {
  const startTime = Date.now();
  const complexity = assessComplexity(messages);
  const circuitStatus = getCircuitStatus();

  const isGeminiEligible = !!geminiKey && circuitStatus.state !== CircuitState.OPEN;
  const isOpenAIConfigured = !!openaiKey;

  let finalResponse = null;
  let providerUsed = null;
  let modelUsed = null;
  let routingReason = "gemini_primary";
  let fallbackAttempts = 0;
  let geminiFailureInfo = null;
  let openAIFailureInfo = null;

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 1: Attempt Gemini (if circuit is CLOSED or HALF_OPEN)
  // ─────────────────────────────────────────────────────────────────────────
  if (isGeminiEligible) {
    if (circuitStatus.state === CircuitState.HALF_OPEN) {
      routingReason = "gemini_recovery_probe";
    }

    const geminiResult = await executeGemini(geminiKey, messages, contextBlock, complexity);

    if (geminiResult.success) {
      const validation = validateResponse(geminiResult.text);
      if (validation.isValid) {
        recordGeminiSuccess();
        providerUsed = "gemini";
        modelUsed = geminiResult.model;
        finalResponse = validation.cleanedText;

        logTelemetry({
          correlationId,
          provider: "gemini",
          model: modelUsed,
          latencyMs: Date.now() - startTime,
          success: true,
          routingReason,
          fallbackAttempts: geminiResult.attempts - 1,
        });

        return {
          success: true,
          response: finalResponse,
          provider: "gemini",
          model: modelUsed,
          isFallback: false,
          routingReason,
        };
      }
    }

    // Gemini failed
    geminiFailureInfo = {
      category: geminiResult.category,
      error: geminiResult.error,
      model: geminiResult.model,
    };
    fallbackAttempts = (geminiResult.attempts || 1);
    recordGeminiFailure(geminiResult.category);
    routingReason = `openai_fallback_gemini_${geminiResult.category.toLowerCase()}`;
    console.warn(`[Router] Gemini failed (${geminiResult.category}). Checking OpenAI fallback eligibility...`);
  } else if (circuitStatus.state === CircuitState.OPEN) {
    routingReason = `openai_circuit_open_gemini_${circuit.lastFailureCategory?.toLowerCase() || "down"}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 2: Failover to OpenAI (Secondary Provider)
  // ─────────────────────────────────────────────────────────────────────────
  if (isOpenAIConfigured) {
    console.log(`[Router] Executing request with OpenAI fallback (${routingReason})...`);
    const openAIResult = await executeOpenAI(openaiKey, messages, contextBlock, complexity);

    if (openAIResult.success) {
      const validation = validateResponse(openAIResult.text);
      if (validation.isValid) {
        providerUsed = "openai";
        modelUsed = openAIResult.model;
        finalResponse = validation.cleanedText;

        logTelemetry({
          correlationId,
          provider: "openai",
          model: modelUsed,
          latencyMs: Date.now() - startTime,
          success: true,
          routingReason,
          fallbackAttempts,
        });

        return {
          success: true,
          response: finalResponse,
          provider: "openai",
          model: modelUsed,
          routingReason,
          isFallback: true,
        };
      }
    }

    // OpenAI also failed
    openAIFailureInfo = {
      category: openAIResult.category,
      error: openAIResult.error,
      model: openAIResult.model,
    };
    console.error(`[Router] OpenAI fallback also failed (${openAIResult.category}):`, openAIResult.error);
    logTelemetry({
      correlationId,
      provider: "openai",
      model: openAIResult.model,
      latencyMs: Date.now() - startTime,
      success: false,
      category: openAIResult.category,
      routingReason,
      fallbackAttempts: fallbackAttempts + 1,
      errorMessage: openAIResult.error,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 3: Neither Provider Could Fulfill Request
  // ─────────────────────────────────────────────────────────────────────────
  let userFriendlyError = "Our health AI services are momentarily busy. Please try again in 30 seconds.";

  if (!geminiKey && !openaiKey) {
    userFriendlyError = "No AI providers are configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your deployment environment.";
  } else if (!openaiKey) {
    if (circuit.lastFailureCategory === FailureCategory.HIGH_DEMAND) {
      userFriendlyError = "Google Gemini is currently experiencing a peak capacity spike. Configure OPENAI_API_KEY in Netlify to enable instant automatic backup, or try again in a moment.";
    } else if (circuit.lastFailureCategory === FailureCategory.RATE_LIMIT || circuit.lastFailureCategory === FailureCategory.QUOTA_EXHAUSTED) {
      userFriendlyError = "Google Gemini rate limit reached. Add an OPENAI_API_KEY to enable automatic secondary failover, or wait 30 seconds.";
    }
  }

  return {
    success: false,
    error: "ALL_PROVIDERS_UNAVAILABLE",
    message: userFriendlyError,
    circuitState: circuit.state,
    geminiConfigured: !!geminiKey,
    openaiConfigured: isOpenAIConfigured,
    diagnostics: {
      gemini: geminiFailureInfo,
      openai: openAIFailureInfo,
    },
  };
}
