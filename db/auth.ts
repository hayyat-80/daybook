/**
 * Simple shared-secret gate for personal API use.
 * Set API_SECRET in env; clients send `x-api-secret` header.
 */
export function assertApiSecret(request: Request): Response | null {
  const expected = process.env.API_SECRET;
  if (!expected) {
    // Dev convenience: allow if secret not configured
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return Response.json({ error: "API_SECRET is not configured" }, { status: 500 });
    }
    return null;
  }

  const provided = request.headers.get("x-api-secret");
  if (provided !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
