import { dataOwnerEmail } from "@/db/owner";
import { findUserByEmail } from "@/db/repositories/users";
import { getSessionFromRequest } from "@/lib/auth/session";

/**
 * Resolve the user id for a data API request.
 * Session users use their own id; x-api-secret maps to the data owner account.
 */
export async function requireUserId(request: Request): Promise<string | Response> {
  const session = await getSessionFromRequest(request);
  if (session?.sub) return session.sub;

  const expected = process.env.API_SECRET?.trim();
  const provided = request.headers.get("x-api-secret");
  if (expected && provided === expected) {
    const owner = await findUserByEmail(dataOwnerEmail());
    if (owner) return owner.id;
    return Response.json(
      { error: `Data owner ${dataOwnerEmail()} is not registered yet` },
      { status: 500 },
    );
  }

  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
