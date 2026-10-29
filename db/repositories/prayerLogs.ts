import { eq } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { prayerLogs } from "@/db/schema";
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

export async function getAllPrayerLogs(): Promise<Record<string, DailyPrayerLog>> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(prayerLogs);
  const out: Record<string, DailyPrayerLog> = {};
  for (const row of rows) {
    out[row.dateKey] = rowToLog(row);
  }
  return out;
}

export async function saveAllPrayerLogs(logs: Record<string, DailyPrayerLog>): Promise<void> {
  await ensureSchema();
  const db = getDb();

  // Replace snapshot: clear then insert (personal DB, small volume).
  await db.delete(prayerLogs);
  const values = Object.values(logs).map((log) => ({
    dateKey: log.dateKey,
    fajr: log.prayers.fajr,
    dhuhr: log.prayers.dhuhr,
    asr: log.prayers.asr,
    maghrib: log.prayers.maghrib,
    isha: log.prayers.isha,
    updatedAt: log.updatedAt,
  }));
  if (values.length === 0) return;
  await db.insert(prayerLogs).values(values);
}

export async function upsertPrayerLog(log: DailyPrayerLog): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const payload = {
    dateKey: log.dateKey,
    fajr: log.prayers.fajr,
    dhuhr: log.prayers.dhuhr,
    asr: log.prayers.asr,
    maghrib: log.prayers.maghrib,
    isha: log.prayers.isha,
    updatedAt: log.updatedAt,
  };
  await db.insert(prayerLogs).values(payload).onConflictDoUpdate({
    target: prayerLogs.dateKey,
    set: payload,
  });
}

export async function getPrayerLog(dateKey: string): Promise<DailyPrayerLog | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(prayerLogs).where(eq(prayerLogs.dateKey, dateKey)).limit(1);
  return rows[0] ? rowToLog(rows[0]) : null;
}
