import { getSettings, saveSettings } from "@/db/repositories/settings";
import { withApiAuth } from "@/lib/apiHttp";
import type { AppSettings } from "@/types/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const settings = await getSettings();
  return Response.json({ settings });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as { settings?: AppSettings };
  if (!body.settings) {
    return Response.json({ error: "Missing settings" }, { status: 400 });
  }
  await saveSettings(body.settings);
  return Response.json({ ok: true });
});
