import {
  getTimetableSnapshot,
  saveTimetableSnapshot,
  type TimetableSnapshot,
} from "@/db/repositories/timetable";
import { withApiAuth } from "@/lib/apiHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const timetable = await getTimetableSnapshot();
  return Response.json({ timetable });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as { timetable?: TimetableSnapshot };
  if (!body.timetable) {
    return Response.json({ error: "Missing timetable" }, { status: 400 });
  }
  await saveTimetableSnapshot(body.timetable);
  return Response.json({ ok: true });
});
