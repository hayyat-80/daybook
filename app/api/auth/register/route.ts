import { appendSessionCookie } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, isAuthConfigured } from "@/lib/auth/session";
import { validateRegisterInput } from "@/lib/auth/validation";
import { getClient } from "@/db/client";
import { migrateUserScope } from "@/db/migrateUserScope";
import {
  countUsers,
  createUser,
  findUserByEmail,
  isRegistrationOpen,
  roleForNewUser,
} from "@/db/repositories/users";

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

  const parsed = validateRegisterInput((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) {
    return Response.json({ error: "Validation failed", errors: parsed.errors }, { status: 400 });
  }

  const userCount = await countUsers();
  if (!isRegistrationOpen(userCount)) {
    return Response.json(
      { error: "Registration is closed", code: "registrationClosed" },
      { status: 403 },
    );
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return Response.json(
      { error: "Email already registered", errors: { email: "emailTaken" } },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const role = roleForNewUser(userCount);
  const user = await createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
    role,
  });

  // Link any pre-auth data to the data-owner / first admin account.
  await migrateUserScope(getClient());

  const token = await createSessionToken(user);
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

export async function GET() {
  const userCount = await countUsers();
  return Response.json({
    open: isRegistrationOpen(userCount),
    bootstrap: userCount === 0,
  });
}
