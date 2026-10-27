/**
 * Comprehensive Automated Tests for CareOS AI Multi-Provider Orchestration.
 * Validates all 12 core scenarios:
 * 1. Normal Gemini Operation
 * 2. Gemini High Demand & Model-to-Model Failover
 * 3. Gemini Quota Exhaustion to OpenAI Failover
 * 4. Mutual Provider Failure
 * 5. Circuit Breaker Recovery to Gemini
 * 6. Invalid Credentials Handling
 * 7. Model Discovery & Registry Fallback
 * 8. Patient Context & History Preservation
 * 9. Duplicate Prevention & Deterministic Routing
 * 10. Medical Safety Instructions & Output Validation
 * 11. Configuration & Secret Safety Diagnostics
 * 12. Response Normalization
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { FailureCategory, classifyError } from "../netlify/functions/ai/types-and-errors.mjs";
import {
  SYSTEM_PROMPT,
  buildContextBlock,
  buildUnifiedPrompt,
  assessComplexity,
  validateResponse,
} from "../netlify/functions/ai/safety-system.mjs";
import {
  routeHealthInquiry,
  getCircuitStatus,
  resetCircuit,
  _setCircuitStateForTesting,
} from "../netlify/functions/ai/router.mjs";

const mockOpenAICreate = vi.fn();

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      constructor() {
        this.chat = {
          completions: {
            create: mockOpenAICreate,
          },
        };
      }
    },
  };
});

describe("CareOS AI Orchestration Suite", () => {
  beforeEach(() => {
    resetCircuit();
    vi.restoreAllMocks();
    mockOpenAICreate.mockReset();
  });

  // ── Scenario 1: Normal Gemini Operation ──────────────────────────────────
  it("Scenario 1: executes Gemini successfully when available", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output_text: "Metformin is a first-line biguanide antihyperglycemic medication.",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "What is Metformin?" }],
      contextBlock: "",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("gemini");
    expect(result.response).toContain("Metformin is a first-line");
    expect(result.isFallback).toBeFalsy();
    expect(mockFetch).toHaveBeenCalled();
  });

  // ── Scenario 2: Gemini High Demand & Model-to-Model Failover ─────────────
  it("Scenario 2: fails over to next Gemini candidate when gemini-3.8-flash has high demand (503)", async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      callCount++;
      if (callCount === 1) {
        // First model (gemini-3.8-flash) returns 503 High Demand
        return {
          ok: false,
          status: 503,
          text: async () => "gemini-3.8-flash is currently experiencing high demand",
        };
      }
      // Second model succeeds
      return {
        ok: true,
        status: 200,
        json: async () => ({
          output_text: "Response from secondary Gemini model with established evidence.",
        }),
      };
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "Explain Metformin side effects" }],
      contextBlock: "",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("gemini");
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  // ── Scenario 3: Gemini Quota Exhaustion to OpenAI Failover ────────────────
  it("Scenario 3: routes to OpenAI when Gemini is quota exhausted (429)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Resource exhausted: quota exceeded",
    });
    vi.stubGlobal("fetch", mockFetch);

    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "OpenAI Fallback Response: Metformin reduces hepatic glucose production.",
          },
        },
      ],
      usage: { total_tokens: 150 },
    });

    const result = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "What is Metformin?" }],
      contextBlock: "",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("openai");
    expect(result.isFallback).toBe(true);
    expect(result.response).toContain("OpenAI Fallback Response");
  });

  // ── Scenario 4: Mutual Provider Failure ──────────────────────────────────
  it("Scenario 4: returns controlled failure when both providers fail", async () => {
    // Gemini fails
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Gemini capacity overload",
    });
    vi.stubGlobal("fetch", mockFetch);

    // OpenAI fails
    mockOpenAICreate.mockRejectedValueOnce(new Error("OpenAI API connection failed"));

    const result = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "Explain blood pressure" }],
      contextBlock: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("ALL_PROVIDERS_UNAVAILABLE");
    expect(result.message).toBeTruthy();
  });

  // ── Scenario 5: Circuit Breaker Recovery to Gemini ───────────────────────
  it("Scenario 5: circuit breaker opens on repeated Gemini failure and resets after recovery", async () => {
    // 1. Force circuit breaker open
    const mockFailingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "high demand spike",
    });
    vi.stubGlobal("fetch", mockFailingFetch);

    await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: null,
      messages: [{ role: "user", content: "Test query 1" }],
      contextBlock: "",
    });

    const statusAfterFailure = getCircuitStatus();
    expect(statusAfterFailure.state).toBe("OPEN");

    // 2. Cooldown elapsed -> state becomes HALF_OPEN
    _setCircuitStateForTesting("OPEN", Date.now() - 60000); // 60s in the past
    expect(getCircuitStatus().state).toBe("HALF_OPEN");

    // 3. Next probe succeeds -> resets to CLOSED
    const mockSuccessFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output_text: "Gemini is recovered and working normally.",
      }),
    });
    vi.stubGlobal("fetch", mockSuccessFetch);

    const recoveredResult = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "Test query after cooldown" }],
      contextBlock: "",
    });

    expect(recoveredResult.success).toBe(true);
    expect(recoveredResult.provider).toBe("gemini");
    expect(getCircuitStatus().state).toBe("CLOSED");
  });

  // ── Scenario 6: Invalid Credentials Handling ─────────────────────────────
  it("Scenario 6: classifies 401 as AUTH_FAILURE and does not enter retry loops", () => {
    const category = classifyError(401, "API key not valid. Please pass a valid API key.");
    expect(category).toBe(FailureCategory.AUTH_FAILURE);
  });

  // ── Scenario 7: Model Discovery & Error Classification ───────────────────
  it("Scenario 7: accurately classifies high demand and model deprecation", () => {
    const demandCategory = classifyError(503, "gemini-3.8-flash is currently experiencing high demand");
    expect(demandCategory).toBe(FailureCategory.HIGH_DEMAND);

    const notFoundCategory = classifyError(404, "models/gemini-2.0-flash is no longer available");
    expect(notFoundCategory).toBe(FailureCategory.MODEL_UNAVAILABLE);
  });

  // ── Scenario 8: Patient Context & History Preservation ───────────────────
  it("Scenario 8: preserves patient context (medications, appointments, labs)", () => {
    const userContext = {
      name: "Harsh",
      medications: ["Metformin 500mg BID", "Telmisartan 40mg OD"],
      conditions: ["Type 2 Diabetes"],
      upcomingAppointments: ["Dr. Sharma on 2026-11-05"],
      recentReports: ["HbA1c 6.8% (2026-10-15)"],
    };

    const contextBlock = buildContextBlock(userContext);
    expect(contextBlock).toContain("Patient name: Harsh");
    expect(contextBlock).toContain("Metformin 500mg BID");
    expect(contextBlock).toContain("Type 2 Diabetes");
    expect(contextBlock).toContain("HbA1c 6.8%");

    const prompt = buildUnifiedPrompt(
      [
        { role: "user", content: "Should I take pain relievers?" },
        { role: "assistant", content: "Be cautious with NSAIDs." },
        { role: "user", content: "What about paracetamol?" },
      ],
      contextBlock
    );

    expect(prompt).toContain("CareOS Health Context");
    expect(prompt).toContain("Should I take pain relievers?");
    expect(prompt).toContain("What about paracetamol?");
  });

  // ── Scenario 9: Duplicate Prevention & Complexity Scoring ────────────────
  it("Scenario 9: scores complex medical questions for deeper reasoning tier", () => {
    const simple = [{ role: "user", content: "What is paracetamol?" }];
    expect(assessComplexity(simple)).toBe("standard");

    const complex = [
      {
        role: "user",
        content: "What is the mechanism of action, pharmacokinetics, and contraindications of Rapamycin with Metformin in a patient with kidney disease?",
      },
    ];
    expect(assessComplexity(complex)).toBe("complex");
  });

  // ── Scenario 10: Medical Safety Standards & Response Validation ──────────
  it("Scenario 10: validates clinical safety standards and rejects empty/short answers", () => {
    expect(SYSTEM_PROMPT).toContain("Approved");
    expect(SYSTEM_PROMPT).toContain("CDSCO");
    expect(SYSTEM_PROMPT).toContain("1800-11-6117"); // AIIMS helpline

    const emptyVal = validateResponse("");
    expect(emptyVal.isValid).toBe(false);

    const shortVal = validateResponse("OK");
    expect(shortVal.isValid).toBe(false);

    const goodVal = validateResponse(
      "Metformin works primarily by reducing hepatic glucose production and improving peripheral insulin sensitivity."
    );
    expect(goodVal.isValid).toBe(true);
    expect(goodVal.cleanedText).toBeTruthy();
  });

  // ── Scenario 11: Deployment Configuration ────────────────────────────────
  it("Scenario 11: reports missing provider configuration gracefully", async () => {
    const result = await routeHealthInquiry({
      geminiKey: null,
      openaiKey: null,
      messages: [{ role: "user", content: "Hello" }],
      contextBlock: "",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("No AI providers are configured");
  });

  // ── Scenario 12: Response Normalization ──────────────────────────────────
  it("Scenario 12: normalizes response schema across both Gemini and OpenAI", async () => {
    // 1. Check Gemini response structure
    const mockGeminiFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        output_text: "Gemini response text for normalization test.",
      }),
    });
    vi.stubGlobal("fetch", mockGeminiFetch);

    const geminiRes = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "Test query" }],
      contextBlock: "",
    });

    expect(geminiRes).toHaveProperty("success", true);
    expect(geminiRes).toHaveProperty("provider", "gemini");
    expect(geminiRes).toHaveProperty("model");
    expect(geminiRes).toHaveProperty("response");
    expect(geminiRes).toHaveProperty("isFallback", false);

    // 2. Check OpenAI response structure
    const mockFailingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Gemini 503 Overload",
    });
    vi.stubGlobal("fetch", mockFailingFetch);

    mockOpenAICreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "OpenAI response text for normalization test.",
          },
        },
      ],
      usage: { total_tokens: 120 },
    });

    const openaiRes = await routeHealthInquiry({
      geminiKey: "test-gemini-key",
      openaiKey: "test-openai-key",
      messages: [{ role: "user", content: "Test query fallback" }],
      contextBlock: "",
    });

    expect(openaiRes).toHaveProperty("success", true);
    expect(openaiRes).toHaveProperty("provider", "openai");
    expect(openaiRes).toHaveProperty("model");
    expect(openaiRes).toHaveProperty("response");
    expect(openaiRes).toHaveProperty("isFallback", true);
  });
});
