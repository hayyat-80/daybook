import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export function appendSessionCookie(response: Response, token: string, maxAge?: number): void {
  const opts = sessionCookieOptions(maxAge);
  response.headers.append(
    "Set-Cookie",
    [
      `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
      `Path=${opts.path}`,
      `Max-Age=${opts.maxAge}`,
      `HttpOnly`,
      `SameSite=${opts.sameSite}`,
      opts.secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
}

export function clearSessionCookie(response: Response): void {
  appendSessionCookie(response, "", 0);
}
