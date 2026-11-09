import { eq, sql } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { users } from "@/db/schema";
import type { AuthUser, UserRole } from "@/types/auth";
import { isUserRole } from "@/lib/auth/validation";

function newUserId(): string {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toAuthUser(row: {
  id: string;
  email: string;
  name: string;
  role: string;
}): AuthUser | null {
  if (!isUserRole(row.role)) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function countUsers(): Promise<number> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select({ n: sql<number>`count(*)` }).from(users);
  return Number(rows[0]?.n ?? 0);
}

export async function findUserByEmail(email: string): Promise<
  | (AuthUser & { passwordHash: string })
  | null
> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const row = rows[0];
  if (!row) return null;
  const auth = toAuthUser(row);
  if (!auth) return null;
  return { ...auth, passwordHash: row.passwordHash };
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return toAuthUser(row);
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}): Promise<AuthUser> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const id = newUserId();
  await db.insert(users).values({
    id,
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    role: input.role,
    createdAt: now,
    updatedAt: now,
  });
  return { id, email: input.email, name: input.name, role: input.role };
}

export async function updateUserProfile(
  userId: string,
  patch: { name?: string; email?: string; passwordHash?: string },
): Promise<AuthUser | null> {
  await ensureSchema();
  const db = getDb();
  const existing = await findUserById(userId);
  if (!existing) return null;
  const updatedAt = new Date().toISOString();
  await db
    .update(users)
    .set({
      name: patch.name ?? existing.name,
      email: patch.email ?? existing.email,
      ...(patch.passwordHash ? { passwordHash: patch.passwordHash } : {}),
      updatedAt,
    })
    .where(eq(users.id, userId));
  return findUserById(userId);
}

/** Open registration: first user always; later users only if AUTH_ALLOW_REGISTER=1. */
export function isRegistrationOpen(userCount: number): boolean {
  if (userCount === 0) return true;
  return process.env.AUTH_ALLOW_REGISTER === "1";
}

/** First account is admin (owns legacy data); every later signup is a regular user. */
export function roleForNewUser(userCount: number): UserRole {
  return userCount === 0 ? "admin" : "user";
}
