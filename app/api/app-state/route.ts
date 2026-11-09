import { getAppState, saveAppState, type AppStateRow } from "@/db/repositories/appState";
import { withUserApi } from "@/lib/apiHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withUserApi(async (_request, userId) => {
  const state = await getAppState(userId);
  return Response.json({ state });
});

export const PUT = withUserApi(async (request, userId) => {
  const body = (await request.json()) as { state?: AppStateRow };
  if (!body.state) {
    return Response.json({ error: "Missing state" }, { status: 400 });
  }
  await saveAppState(userId, body.state);
  return Response.json({ ok: true });
});
