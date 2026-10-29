import { assertApiSecret } from "@/db/auth";

export function withApiAuth(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const denied = assertApiSecret(request);
    if (denied) return denied;
    try {
      return await handler(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return Response.json({ error: message }, { status: 500 });
    }
  };
}
