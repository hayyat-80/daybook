import { getRequestRole, isAuthConfigured, isRequestAuthenticated } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";

/**
 * Gate for personal API use: valid session cookie, or `x-api-secret` matching API_SECRET.
 * When AUTH_SECRET/API_SECRET is unset, auth is off in local/dev only.
 */
export async function assertApiSecret(request: Request): Promise<Response | null> {
  if (!isAuthConfigured()) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return Response.json({ error: "AUTH_SECRET is not configured" }, { status: 500 });
    }
    return null;
  }

  if (await isRequestAuthenticated(request)) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

/** Future role gates — e.g. admin-only routes. */
export async function assertMinRole(
  request: Request,
  minimum: UserRole,
): Promise<Response | null> {
  const denied = await assertApiSecret(request);
  if (denied) return denied;
  const role = await getRequestRole(request);
  if (!hasMinRole(role, minimum)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
