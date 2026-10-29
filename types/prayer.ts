export const PRAYER_IDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type PrayerId = (typeof PRAYER_IDS)[number];

export type PrayerStatus = "prayed" | "missed" | "not_tracked";

export type PrayerTimesForDay = Record<PrayerId, Date>;

export type DailyPrayerLog = {
  dateKey: string;
  prayers: Record<PrayerId, PrayerStatus>;
  updatedAt: string;
};

export type NextPrayerInfo = {
  id: PrayerId;
  time: Date;
  isCurrentWindow: boolean;
};
