/**
 * Netlify Function: ai-health-chat
 * Production Multi-Provider AI Health Intelligence Endpoint.
 *
 * Primary: Google Gemini (Interactions & GenerateContent API)
 * Secondary: OpenAI (Official SDK Fallback)
 *
 * POST /api/ai-health-chat
 * Body: { messages: [{role, content}], userContext?: {...} }
 * or:   { ping: true }
 *
 * GET /api/ai-health-chat -> Returns diagnostic health check without secrets
 */

import { routeHealthInquiry, getCircuitStatus } from "./ai/router.mjs";
import { buildContextBlock } from "./ai/safety-system.mjs";
import { executeGemini, discoverGeminiModels } from "./ai/gemini-provider.mjs";
import { executeOpenAI } from "./ai/openai-provider.mjs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Diagnostic Health Check & Live Probe
  if (req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const circuit = getCircuitStatus();

    if (url.searchParams.get("test") === "true") {
      let geminiProbe = null;
      let openaiProbe = null;
      let modelTests = {};

      const testModels = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-pro"];

      if (GEMINI_API_KEY) {
        for (const m of testModels) {
          try {
            // Direct generateContent test
            const gcUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_API_KEY.trim()}`;
            const res = await fetch(gcUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "hi" }] }]
              })
            });
            const text = await res.text();
            let parsed = null;
            try { parsed = JSON.parse(text); } catch {}
            modelTests[m] = {
              status: res.status,
              ok: res.ok,
              sampleText: parsed?.candidates?.[0]?.content?.parts?.[0]?.text || text.substring(0, 150),
            };
          } catch (e) {
            modelTests[m] = { error: e.message };
          }
        }

        try {
          geminiProbe = await executeGemini(GEMINI_API_KEY, [{ role: "user", content: "Ping" }], "", "standard");
        } catch (err) {
          geminiProbe = { error: err.message };
        }
      }

      if (OPENAI_API_KEY) {
        try {
          openaiProbe = await executeOpenAI(OPENAI_API_KEY, [{ role: "user", content: "Ping" }], "", "standard");
        } catch (err) {
          openaiProbe = { error: err.message };
        }
      }

      let discovered = [];
      if (GEMINI_API_KEY) {
        try {
          discovered = await discoverGeminiModels(GEMINI_API_KEY);
        } catch (e) {
          discovered = [e.message];
        }
      }

      return new Response(
        JSON.stringify({
          status: "diagnostic_test",
          modelTests,
          gemini: {
            configured: !!GEMINI_API_KEY,
            success: geminiProbe?.success || false,
            model: geminiProbe?.model,
            category: geminiProbe?.category,
            error: geminiProbe?.error,
            discoveredModels: discovered,
          },
          openai: {
            configured: !!OPENAI_API_KEY,
            success: openaiProbe?.success || false,
            model: openaiProbe?.model,
            category: openaiProbe?.category,
            error: openaiProbe?.error,
          },
          circuit,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        providers: {
          gemini: {
            configured: !!GEMINI_API_KEY,
            circuitState: circuit.state,
          },
          openai: {
            configured: !!OPENAI_API_KEY,
          },
        },
        circuit,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
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
        status: "ok",
        configured: !!GEMINI_API_KEY || !!OPENAI_API_KEY,
        geminiConfigured: !!GEMINI_API_KEY,
        openaiConfigured: !!OPENAI_API_KEY,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
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
  const correlationId = "req-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 7);

  const result = await routeHealthInquiry({
    geminiKey: GEMINI_API_KEY,
    openaiKey: OPENAI_API_KEY,
    messages: trimmedMessages,
    contextBlock,
    correlationId,
  });

  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: result.error,
        message: result.message,
        circuitState: result.circuitState,
        diagnostics: result.diagnostics,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      response: result.response,
      provider: result.provider,
      model: result.model,
      routingReason: result.routingReason,
      isFallback: !!result.isFallback,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
