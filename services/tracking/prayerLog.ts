import dayjs from "dayjs";

import type { DailyPrayerLog, PrayerId, PrayerStatus } from "@/types/prayer";
import { PRAYER_IDS } from "@/types/prayer";

export function dateKeyFromDate(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function emptyDailyLog(dateKey: string): DailyPrayerLog {
  const prayers = PRAYER_IDS.reduce(
    (acc, id) => {
      acc[id] = "not_tracked";
      return acc;
    },
    {} as Record<PrayerId, PrayerStatus>,
  );
  return {
    dateKey,
    prayers,
    updatedAt: new Date().toISOString(),
  };
}

export function countCompleted(log: DailyPrayerLog): number {
  return PRAYER_IDS.filter((id) => log.prayers[id] === "prayed").length;
}

export function completionRatio(log: DailyPrayerLog): number {
  return countCompleted(log) / PRAYER_IDS.length;
}

export function togglePrayedStatus(current: PrayerStatus): PrayerStatus {
  if (current === "prayed") return "not_tracked";
  return "prayed";
}

export function cyclePrayerStatus(current: PrayerStatus): PrayerStatus {
  if (current === "not_tracked") return "prayed";
  if (current === "prayed") return "missed";
  return "not_tracked";
}
