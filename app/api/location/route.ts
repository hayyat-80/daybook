import { getLocation, saveLocation } from "@/db/repositories/location";
import { withUserApi } from "@/lib/apiHttp";
import type { StoredLocation } from "@/types/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withUserApi(async (_request, userId) => {
  const location = await getLocation(userId);
  return Response.json({ location });
});

export const PUT = withUserApi(async (request, userId) => {
  const body = (await request.json()) as { location?: StoredLocation };
  if (!body.location) {
    return Response.json({ error: "Missing location" }, { status: 400 });
  }
  await saveLocation(userId, body.location);
  return Response.json({ ok: true });
});
