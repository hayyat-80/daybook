import { getDeadlines, saveDeadlines } from "@/db/repositories/deadlines";
import { StaleWriteError } from "@/db/repositories/safety";
import { withUserApi } from "@/lib/apiHttp";
import type { StudyDeadline } from "@/types/deadlines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withUserApi(async (_request, userId) => {
  const deadlines = await getDeadlines(userId);
  return Response.json({ deadlines });
});

export const PUT = withUserApi(async (request, userId) => {
  const body = (await request.json()) as {
    deadlines?: StudyDeadline[];
    knownCount?: number;
  };
  if (!Array.isArray(body.deadlines)) {
    return Response.json({ error: "Missing deadlines" }, { status: 400 });
  }
  try {
    await saveDeadlines(userId, body.deadlines, body.knownCount ?? 0);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StaleWriteError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
});
