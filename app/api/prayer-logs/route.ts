import { getAllPrayerLogs, saveAllPrayerLogs } from "@/db/repositories/prayerLogs";
import { StaleWriteError } from "@/db/repositories/safety";
import { withApiAuth } from "@/lib/apiHttp";
import type { DailyPrayerLog } from "@/types/prayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const prayerLogs = await getAllPrayerLogs();
  return Response.json({ prayerLogs });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as {
    prayerLogs?: Record<string, DailyPrayerLog>;
    knownDayCount?: number;
  };
  if (!body.prayerLogs) {
    return Response.json({ error: "Missing prayerLogs" }, { status: 400 });
  }
  try {
    await saveAllPrayerLogs(body.prayerLogs, body.knownDayCount ?? 0);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StaleWriteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
});
