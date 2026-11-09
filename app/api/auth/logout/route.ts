import { clearSessionCookie } from "@/lib/auth/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = Response.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
