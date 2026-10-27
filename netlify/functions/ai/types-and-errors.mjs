/**
 * Failure classification and telemetry for CareOS AI Orchestration.
 * Never logs PII, medical records, or API credentials.
 */

export const FailureCategory = {
  AUTH_FAILURE: "AUTH_FAILURE",           // 401: Invalid or expired API key
  RATE_LIMIT: "RATE_LIMIT",               // 429: Short-term RPM/burst limit
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",     // 429: Account/daily quota spent
  HIGH_DEMAND: "HIGH_DEMAND",             // 503: Model capacity overload
  MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE", // 404: Deprecated or retired model
  INVALID_REQUEST: "INVALID_REQUEST",     // 400: Malformed payload or schema issue
  TIMEOUT: "TIMEOUT",                     // 504: Network or processing timeout
  SERVER_ERROR: "SERVER_ERROR",           // 500/502: Provider internal server error
  UNKNOWN: "UNKNOWN",
};

/**
 * Classifies HTTP status and error body into an actionable FailureCategory.
 */
export function classifyError(status, message = "", details = "") {
  const combined = `${message} ${details}`.toLowerCase();

  // Authentication errors
  if (status === 401 || combined.includes("api key not valid") || combined.includes("invalid api key") || combined.includes("unauthorized") || combined.includes("api_key_invalid")) {
    return FailureCategory.AUTH_FAILURE;
  }

  // Model unavailable or not found
  if (status === 404 || combined.includes("is not found") || combined.includes("model not found") || combined.includes("no longer available") || combined.includes("model_not_found")) {
    return FailureCategory.MODEL_UNAVAILABLE;
  }

  // High demand / capacity spikes (e.g. Gemini 3.8 Flash overload)
  if (status === 503 || combined.includes("high demand") || combined.includes("currently experiencing high demand") || combined.includes("overloaded") || combined.includes("capacity")) {
    return FailureCategory.HIGH_DEMAND;
  }

  // Quota exhaustion vs rate limit
  if (status === 429 || combined.includes("resource_exhausted") || combined.includes("quota") || combined.includes("exceeded your current quota")) {
    if (combined.includes("quota") || combined.includes("billing") || combined.includes("insufficient_quota")) {
      return FailureCategory.QUOTA_EXHAUSTED;
    }
    return FailureCategory.RATE_LIMIT;
  }

  // Timeout
  if (status === 504 || status === 408 || combined.includes("timeout") || combined.includes("timed out") || combined.includes("econnreset")) {
    return FailureCategory.TIMEOUT;
  }

  // Invalid request
  if (status === 400) {
    return FailureCategory.INVALID_REQUEST;
  }

  // Internal server error
  if (status >= 500) {
    return FailureCategory.SERVER_ERROR;
  }

  return FailureCategory.UNKNOWN;
}

/**
 * Structured, sanitized operational telemetry logging.
 * Excludes prompt content, personal health records, and credentials.
 */
export function logTelemetry(event) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    correlationId: event.correlationId || "req-" + Math.random().toString(36).substring(2, 9),
    provider: event.provider,
    model: event.model,
    latencyMs: event.latencyMs,
    success: !!event.success,
    category: event.category || (event.success ? "SUCCESS" : "FAILURE"),
    routingReason: event.routingReason || "primary",
    fallbackAttempts: event.fallbackAttempts || 0,
    retryCount: event.retryCount || 0,
  };

  if (!event.success && event.errorMessage) {
    // Sanitize message: strip potential secrets or URLs with keys
    logEntry.sanitizedError = String(event.errorMessage).replace(/key=[^&\s]+/gi, "key=[REDACTED]").substring(0, 200);
  }

  console.log(`[AI-TELEMETRY] ${JSON.stringify(logEntry)}`);
}
