import { assertApiSecret } from "@/db/auth";
import { requireUserId } from "@/lib/auth/requestUser";

export function withApiAuth(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const denied = await assertApiSecret(request);
    if (denied) return denied;
    try {
      return await handler(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

/** Authenticated handler that always receives the scoped user id. */
export function withUserApi(
  handler: (request: Request, userId: string) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return withApiAuth(async (request) => {
    const userIdOrError = await requireUserId(request);
    if (userIdOrError instanceof Response) return userIdOrError;
    return handler(request, userIdOrError);
  });
}
