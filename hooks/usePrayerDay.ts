import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import {
  calculatePrayerTimes,
  formatRemaining,
  formatTime,
  getNextPrayer,
  getRemainingMs,
} from "@/services/prayer/calculation";
import { useAppStore } from "@/stores/appStore";
import type { PrayerId } from "@/types/prayer";
import { PRAYER_IDS } from "@/types/prayer";
import { useTranslation } from "react-i18next";

export type PrayerScheduleRow = {
  id: PrayerId;
  time: Date;
  timeLabel: string;
  isHighlighted: boolean;
  isUpcoming: boolean;
};

export function usePrayerDay(now: Date) {
  const location = useAppStore((s) => s.location);
  const settings = useAppStore((s) => s.settings);
  const { i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar" : i18n.language === "de" ? "de-DE" : "en-US";

  const today = useMemo(() => dayjs(now).startOf("day").toDate(), [now]);

  const timesToday = useMemo(
    () =>
      calculatePrayerTimes({
        latitude: location.latitude,
        longitude: location.longitude,
        date: today,
        calculationMethod: settings.calculationMethod,
        madhab: settings.madhab,
        highLatitudeRule: settings.highLatitudeRule,
        adjustments: settings.adjustments,
      }),
    [location, settings, today],
  );

  const timesTomorrow = useMemo(() => {
    const tomorrow = dayjs(today).add(1, "day").toDate();
    return calculatePrayerTimes({
      latitude: location.latitude,
      longitude: location.longitude,
      date: tomorrow,
      calculationMethod: settings.calculationMethod,
      madhab: settings.madhab,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.adjustments,
    });
  }, [location, settings, today]);

  const nextInfo = useMemo(() => {
    const next = getNextPrayer(timesToday, now);
    if (next) return next;

    return {
      id: "fajr" as PrayerId,
      time: timesTomorrow.fajr,
      isCurrentWindow: false,
    };
  }, [timesToday, timesTomorrow, now]);

  const remainingMs = getRemainingMs(nextInfo.time, now);
  const remainingLabel =
    remainingMs <= 0 && nextInfo.isCurrentWindow
      ? "now"
      : remainingMs <= 0
        ? formatRemaining(getRemainingMs(timesTomorrow.fajr, now))
        : formatRemaining(remainingMs);

  const schedule: PrayerScheduleRow[] = PRAYER_IDS.map((id) => {
    const time = timesToday[id];
    const highlighted =
      nextInfo.isCurrentWindow && nextInfo.id === id && nextInfo.time.getTime() === time.getTime();
    const upcoming =
      !nextInfo.isCurrentWindow && nextInfo.id === id && nextInfo.time.getTime() === time.getTime();
    return {
      id,
      time,
      timeLabel: formatTime(time, locale),
      isHighlighted: highlighted || upcoming,
      isUpcoming: upcoming,
    };
  });

  return {
    timesToday,
    nextInfo,
    remainingLabel,
    schedule,
    heroTimeLabel: formatTime(nextInfo.time, locale),
  };
}

export function useTickingNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
