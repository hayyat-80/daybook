import { eq } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { location } from "@/db/schema";
import { DEFAULT_LOCATION, type StoredLocation } from "@/types/settings";

export async function getLocation(): Promise<StoredLocation> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(location).where(eq(location.id, 1)).limit(1);
  if (!rows[0]) return DEFAULT_LOCATION;
  const row = rows[0];
  return {
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city,
    country: row.country,
    timezone: row.timezone,
    source: row.source as StoredLocation["source"],
    updatedAt: row.updatedAt,
  };
}

export async function saveLocation(value: StoredLocation): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const payload = {
    id: 1 as const,
    latitude: value.latitude,
    longitude: value.longitude,
    city: value.city,
    country: value.country,
    timezone: value.timezone,
    source: value.source,
    updatedAt: value.updatedAt,
  };
  await db
    .insert(location)
    .values(payload)
    .onConflictDoUpdate({
      target: location.id,
      set: { ...payload },
    });
}
