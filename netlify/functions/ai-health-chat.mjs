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

  // Diagnostic Health Check
  if (req.method === "GET") {
    const circuit = getCircuitStatus();
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
