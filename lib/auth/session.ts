/** Signed httpOnly session cookie — Edge + Node compatible (Web Crypto). */

import type { AuthUser, SessionPayload, UserRole } from "@/types/auth";
import { isUserRole } from "@/lib/auth/validation";

export const SESSION_COOKIE = "daybook_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function authSigningSecret(): string | null {
  return process.env.AUTH_SECRET?.trim() || process.env.API_SECRET?.trim() || null;
}

/** Auth is on when a signing secret exists (user accounts in DB). */
export function isAuthConfigured(): boolean {
  return Boolean(authSigningSecret());
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function textToBytes(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, textToBytes(payload));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const aBytes = textToBytes(a);
  const bBytes = textToBytes(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i]! ^ bBytes[i]!;
  return diff === 0;
}

export async function createSessionToken(user: AuthUser): Promise<string | null> {
  const secret = authSigningSecret();
  if (!secret) return null;
  const payloadObj: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const payload = bytesToBase64Url(textToBytes(JSON.stringify(payloadObj)));
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

export async function readSessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = authSigningSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts as [string, string];
  const expected = await sign(payload, secret);
  if (!(await timingSafeEqual(sig, expected))) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(payload));
    const data = JSON.parse(json) as Partial<SessionPayload>;
    if (typeof data.sub !== "string" || typeof data.email !== "string") return null;
    if (typeof data.name !== "string" || !isUserRole(data.role)) return null;
    if (typeof data.exp !== "number") return null;
    if (data.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      sub: data.sub,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  return (await readSessionToken(token)) !== null;
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function parseCookieHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const cookie = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);
  return readSessionToken(cookie);
}

export async function isRequestAuthenticated(request: Request): Promise<boolean> {
  if (await getSessionFromRequest(request)) return true;

  const expected = process.env.API_SECRET?.trim();
  if (!expected) return false;
  const provided = request.headers.get("x-api-secret");
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}

/** Machine callers using x-api-secret are treated as admin for future role gates. */
export async function getRequestRole(request: Request): Promise<UserRole | null> {
  const session = await getSessionFromRequest(request);
  if (session) return session.role;

  const expected = process.env.API_SECRET?.trim();
  const provided = request.headers.get("x-api-secret");
  if (expected && provided && (await timingSafeEqual(provided, expected))) {
    return "admin";
  }
  return null;
}
