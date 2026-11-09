import { appendSessionCookie } from "@/lib/auth/cookies";
import { verifyPasswordHash } from "@/lib/auth/password";
import { createSessionToken, isAuthConfigured } from "@/lib/auth/session";
import { validateLoginInput } from "@/lib/auth/validation";
import { findUserByEmail } from "@/db/repositories/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return Response.json({ error: "AUTH_SECRET is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = validateLoginInput((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) {
    return Response.json({ error: "Validation failed", errors: parsed.errors }, { status: 400 });
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPasswordHash(parsed.data.password, user.passwordHash))) {
    return Response.json(
      { error: "Invalid email or password", code: "invalidCredentials" },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  if (!token) {
    return Response.json({ error: "Could not create session" }, { status: 500 });
  }

  const response = Response.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  appendSessionCookie(response, token);
  return response;
}
