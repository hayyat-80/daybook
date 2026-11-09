import { appendSessionCookie } from "@/lib/auth/cookies";
import { hashPassword, verifyPasswordHash } from "@/lib/auth/password";
import {
  createSessionToken,
  getSessionFromRequest,
} from "@/lib/auth/session";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth/validation";
import { withUserApi } from "@/lib/apiHttp";
import {
  findUserByEmail,
  findUserById,
  updateUserProfile,
} from "@/db/repositories/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withUserApi(async (_request, userId) => {
  const user = await findUserById(userId);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export const PUT = withUserApi(async (request, userId) => {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Session required" }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const errors: Record<string, string> = {};
  const nameErr = body.name !== undefined ? validateName(body.name) : null;
  if (nameErr) errors.name = nameErr;
  const emailErr = body.email !== undefined ? validateEmail(body.email) : null;
  if (emailErr) errors.email = emailErr;

  const changingPassword = Boolean(body.newPassword);
  if (changingPassword) {
    const pwErr = validatePassword(body.newPassword);
    if (pwErr) errors.newPassword = pwErr;
    if (!body.currentPassword) errors.currentPassword = "passwordRequired";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "Validation failed", errors }, { status: 400 });
  }

  const current = await findUserByEmail(session.email);
  if (!current || current.id !== userId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const nextEmail =
    body.email !== undefined ? normalizeEmail(body.email) : current.email;
  if (nextEmail !== current.email) {
    const taken = await findUserByEmail(nextEmail);
    if (taken && taken.id !== userId) {
      return Response.json(
        { error: "Email already registered", errors: { email: "emailTaken" } },
        { status: 409 },
      );
    }
  }

  let passwordHash: string | undefined;
  if (changingPassword) {
    if (!(await verifyPasswordHash(body.currentPassword!, current.passwordHash))) {
      return Response.json(
        { error: "Current password is wrong", errors: { currentPassword: "passwordIncorrect" } },
        { status: 400 },
      );
    }
    passwordHash = await hashPassword(body.newPassword!);
  }

  const updated = await updateUserProfile(userId, {
    name: body.name !== undefined ? body.name.trim() : undefined,
    email: body.email !== undefined ? nextEmail : undefined,
    passwordHash,
  });
  if (!updated) return Response.json({ error: "User not found" }, { status: 404 });

  const token = await createSessionToken(updated);
  const response = Response.json({
    user: { id: updated.id, email: updated.email, name: updated.name },
  });
  if (token) appendSessionCookie(response, token);
  return response;
});
