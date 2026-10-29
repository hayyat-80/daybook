import { getAppState, saveAppState, type AppStateRow } from "@/db/repositories/appState";
import { withApiAuth } from "@/lib/apiHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const state = await getAppState();
  return Response.json({ state });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as { state?: AppStateRow };
  if (!body.state) {
    return Response.json({ error: "Missing state" }, { status: 400 });
  }
  await saveAppState(body.state);
  return Response.json({ ok: true });
});
