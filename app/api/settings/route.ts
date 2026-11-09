import { getSettings, saveSettings } from "@/db/repositories/settings";
import { withUserApi } from "@/lib/apiHttp";
import type { AppSettings } from "@/types/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withUserApi(async (_request, userId) => {
  const settings = await getSettings(userId);
  return Response.json({ settings });
});

export const PUT = withUserApi(async (request, userId) => {
  const body = (await request.json()) as { settings?: AppSettings };
  if (!body.settings) {
    return Response.json({ error: "Missing settings" }, { status: 400 });
  }
  await saveSettings(userId, body.settings);
  return Response.json({ ok: true });
});
