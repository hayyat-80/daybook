import { getAllPrayerLogs, saveAllPrayerLogs } from "@/db/repositories/prayerLogs";
import { withApiAuth } from "@/lib/apiHttp";
import type { DailyPrayerLog } from "@/types/prayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const prayerLogs = await getAllPrayerLogs();
  return Response.json({ prayerLogs });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as { prayerLogs?: Record<string, DailyPrayerLog> };
  if (!body.prayerLogs) {
    return Response.json({ error: "Missing prayerLogs" }, { status: 400 });
  }
  await saveAllPrayerLogs(body.prayerLogs);
  return Response.json({ ok: true });
});
