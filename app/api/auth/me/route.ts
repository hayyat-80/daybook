import { getSessionFromRequest, isRequestAuthenticated } from "@/lib/auth/session";
import { findUserById } from "@/db/repositories/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isRequestAuthenticated(request))) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    // Machine token (x-api-secret)
    return Response.json({
      authenticated: true,
      user: { id: "machine", email: null, name: "API", role: "admin" },
    });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
