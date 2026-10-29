import { getLocation, saveLocation } from "@/db/repositories/location";
import { withApiAuth } from "@/lib/apiHttp";
import type { StoredLocation } from "@/types/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiAuth(async () => {
  const location = await getLocation();
  return Response.json({ location });
});

export const PUT = withApiAuth(async (request) => {
  const body = (await request.json()) as { location?: StoredLocation };
  if (!body.location) {
    return Response.json({ error: "Missing location" }, { status: 400 });
  }
  await saveLocation(body.location);
  return Response.json({ ok: true });
});
