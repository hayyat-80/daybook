import { and, eq } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { prayerLogs } from "@/db/schema";
import { assertFreshReplace } from "@/db/repositories/safety";
import type { DailyPrayerLog, PrayerStatus } from "@/types/prayer";

function rowToLog(row: typeof prayerLogs.$inferSelect): DailyPrayerLog {
  return {
    dateKey: row.dateKey,
    prayers: {
      fajr: row.fajr as PrayerStatus,
      dhuhr: row.dhuhr as PrayerStatus,
      asr: row.asr as PrayerStatus,
      maghrib: row.maghrib as PrayerStatus,
      isha: row.isha as PrayerStatus,
    },
    updatedAt: row.updatedAt,
  };
}

export async function getAllPrayerLogs(userId: string): Promise<Record<string, DailyPrayerLog>> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(prayerLogs).where(eq(prayerLogs.userId, userId));
  const out: Record<string, DailyPrayerLog> = {};
  for (const row of rows) {
    out[row.dateKey] = rowToLog(row);
  }
  return out;
}

export async function saveAllPrayerLogs(
  userId: string,
  logs: Record<string, DailyPrayerLog>,
  knownDayCount = 0,
): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const existing = await db
    .select({ dateKey: prayerLogs.dateKey })
    .from(prayerLogs)
    .where(eq(prayerLogs.userId, userId));
  const values = Object.values(logs);
  assertFreshReplace({
    resource: "prayer logs",
    existingCount: existing.length,
    knownCount: knownDayCount,
    incomingCount: values.length,
  });

  await db.delete(prayerLogs).where(eq(prayerLogs.userId, userId));
  if (values.length === 0) return;
  await db.insert(prayerLogs).values(
    values.map((log) => ({
      userId,
      dateKey: log.dateKey,
      fajr: log.prayers.fajr,
      dhuhr: log.prayers.dhuhr,
      asr: log.prayers.asr,
      maghrib: log.prayers.maghrib,
      isha: log.prayers.isha,
      updatedAt: log.updatedAt,
    })),
  );
}

export async function upsertPrayerLog(userId: string, log: DailyPrayerLog): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const payload = {
    userId,
    dateKey: log.dateKey,
    fajr: log.prayers.fajr,
    dhuhr: log.prayers.dhuhr,
    asr: log.prayers.asr,
    maghrib: log.prayers.maghrib,
    isha: log.prayers.isha,
    updatedAt: log.updatedAt,
  };
  await db.insert(prayerLogs).values(payload).onConflictDoUpdate({
    target: [prayerLogs.userId, prayerLogs.dateKey],
    set: {
      fajr: payload.fajr,
      dhuhr: payload.dhuhr,
      asr: payload.asr,
      maghrib: payload.maghrib,
      isha: payload.isha,
      updatedAt: payload.updatedAt,
    },
  });
}

export async function getPrayerLog(
  userId: string,
  dateKey: string,
): Promise<DailyPrayerLog | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db
    .select()
    .from(prayerLogs)
    .where(and(eq(prayerLogs.userId, userId), eq(prayerLogs.dateKey, dateKey)))
    .limit(1);
  return rows[0] ? rowToLog(rows[0]) : null;
}
