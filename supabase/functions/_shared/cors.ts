/**
 * CORS headers for all edge functions.
 * Adjust ALLOWED_ORIGIN to frontend domain in production.
 */

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, x-client-info, apikey",
};

/**
 * Returns a 204 preflight response for OPTIONS requests.
 * Call this at the top of every handler:
 *   if (req.method === "OPTIONS") return preflight();
 */
export function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * Wraps a JSON payload with CORS headers and a given HTTP status.
 */
export function json(
  data: unknown,
  status = 200,
  extra: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extra,
    },
  });
}

/**
 * Convenience helper for error responses.
 */
export function errorResponse(message: string, status = 500): Response {
  return json({ error: message }, status);
}