import {
  getTimetableSnapshot,
  saveTimetableSnapshot,
  type TimetableSnapshot,
} from "@/db/repositories/timetable";
import { StaleWriteError } from "@/db/repositories/safety";
import { withApiAuth } from "@/lib/apiHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const timetable = await getTimetableSnapshot();
  return Response.json({ timetable });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as {
    timetable?: TimetableSnapshot;
    knownEntryCount?: number;
  };
  if (!body.timetable) {
    return Response.json({ error: "Missing timetable" }, { status: 400 });
  }
  try {
    await saveTimetableSnapshot(body.timetable, body.knownEntryCount ?? 0);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StaleWriteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
});
