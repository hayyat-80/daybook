import dayjs from "dayjs";

import type { DailyPrayerLog, PrayerId } from "@/types/prayer";
import { PRAYER_IDS } from "@/types/prayer";
import { countCompleted } from "@/services/tracking/prayerLog";

export type PrayerStats = {
  monthCompletionPercent: number;
  currentStreak: number;
  bestStreak: number;
  mostConsistentPrayer: { id: PrayerId; percent: number } | null;
};

export function computeStats(
  logs: Record<string, DailyPrayerLog>,
  referenceDate = new Date(),
): PrayerStats {
  const monthStart = dayjs(referenceDate).startOf("month");
  const monthEnd = dayjs(referenceDate).endOf("month");
  const monthKeys = Object.keys(logs).filter((key) => {
    const d = dayjs(key);
    return d.isAfter(monthStart.subtract(1, "day")) && d.isBefore(monthEnd.add(1, "day"));
  });

  let monthTotal = 0;
  let monthCompleted = 0;
  for (const key of monthKeys) {
    monthTotal += PRAYER_IDS.length;
    monthCompleted += countCompleted(logs[key]);
  }
  const monthCompletionPercent =
    monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

  const sortedKeys = Object.keys(logs).toSorted();
  const { currentStreak, bestStreak } = computeStreaks(sortedKeys, logs, referenceDate);

  const prayerCounts: Record<PrayerId, { prayed: number; tracked: number }> = {
    fajr: { prayed: 0, tracked: 0 },
    dhuhr: { prayed: 0, tracked: 0 },
    asr: { prayed: 0, tracked: 0 },
    maghrib: { prayed: 0, tracked: 0 },
    isha: { prayed: 0, tracked: 0 },
  };

  for (const key of monthKeys) {
    const log = logs[key];
    for (const id of PRAYER_IDS) {
      const status = log.prayers[id];
      if (status !== "not_tracked") {
        prayerCounts[id].tracked += 1;
        if (status === "prayed") prayerCounts[id].prayed += 1;
      }
    }
  }

  let mostConsistentPrayer: PrayerStats["mostConsistentPrayer"] = null;
  let bestPercent = 0;
  for (const id of PRAYER_IDS) {
    const { prayed, tracked } = prayerCounts[id];
    if (tracked === 0) continue;
    const percent = Math.round((prayed / tracked) * 100);
    if (percent > bestPercent) {
      bestPercent = percent;
      mostConsistentPrayer = { id, percent };
    }
  }

  return {
    monthCompletionPercent,
    currentStreak,
    bestStreak,
    mostConsistentPrayer,
  };
}

function isDayFullyCompleted(log: DailyPrayerLog | undefined): boolean {
  if (!log) return false;
  return countCompleted(log) === PRAYER_IDS.length;
}

function computeStreaks(
  sortedKeys: string[],
  logs: Record<string, DailyPrayerLog>,
  referenceDate: Date,
): { currentStreak: number; bestStreak: number } {
  const completedDays = new Set(sortedKeys.filter((k) => isDayFullyCompleted(logs[k])));

  let bestStreak = 0;
  let run = 0;
  let prev: dayjs.Dayjs | null = null;
  for (const key of sortedKeys) {
    if (!completedDays.has(key)) {
      run = 0;
      prev = null;
      continue;
    }
    const d = dayjs(key);
    if (prev && d.diff(prev, "day") === 1) {
      run += 1;
    } else {
      run = 1;
    }
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  }

  let currentStreak = 0;
  let cursor = dayjs(referenceDate).startOf("day");
  while (true) {
    const key = cursor.format("YYYY-MM-DD");
    if (!completedDays.has(key)) break;
    currentStreak += 1;
    cursor = cursor.subtract(1, "day");
  }

  return { currentStreak, bestStreak };
}
