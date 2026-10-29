import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from "adhan";

import type { PrayerId, PrayerTimesForDay } from "@/types/prayer";
import type {
  CalculationMethodId,
  HighLatitudeRuleId,
  MadhabId,
  PrayerAdjustments,
} from "@/types/settings";
import { PRAYER_IDS } from "@/types/prayer";

function resolveCalculationMethod(id: CalculationMethodId) {
  const map: Record<
    CalculationMethodId,
    () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>
  > = {
    MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
    Egyptian: CalculationMethod.Egyptian,
    Karachi: CalculationMethod.Karachi,
    UmmAlQura: CalculationMethod.UmmAlQura,
    Dubai: CalculationMethod.Dubai,
    MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
    NorthAmerica: CalculationMethod.NorthAmerica,
    Kuwait: CalculationMethod.Kuwait,
    Qatar: CalculationMethod.Qatar,
    Singapore: CalculationMethod.Singapore,
    Tehran: CalculationMethod.Tehran,
    Turkey: CalculationMethod.Turkey,
  };
  return map[id]();
}

function resolveHighLatitudeRule(id: HighLatitudeRuleId) {
  const map = {
    MiddleOfTheNight: HighLatitudeRule.MiddleOfTheNight,
    SeventhOfTheNight: HighLatitudeRule.SeventhOfTheNight,
    TwilightAngle: HighLatitudeRule.TwilightAngle,
  };
  return map[id];
}

function resolveMadhab(id: MadhabId) {
  return id === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
}

function applyAdjustments(date: Date, minutes: number): Date {
  if (minutes === 0) return date;
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export type PrayerCalculationInput = {
  latitude: number;
  longitude: number;
  date: Date;
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
  highLatitudeRule: HighLatitudeRuleId;
  adjustments: PrayerAdjustments;
};

export function calculatePrayerTimes(input: PrayerCalculationInput): PrayerTimesForDay {
  const coordinates = new Coordinates(input.latitude, input.longitude);
  const params = resolveCalculationMethod(input.calculationMethod);
  params.madhab = resolveMadhab(input.madhab);
  params.highLatitudeRule = resolveHighLatitudeRule(input.highLatitudeRule);

  const prayerTimes = new PrayerTimes(coordinates, input.date, params);
  const adj = input.adjustments;

  return {
    fajr: applyAdjustments(prayerTimes.fajr, adj.fajr),
    dhuhr: applyAdjustments(prayerTimes.dhuhr, adj.dhuhr),
    asr: applyAdjustments(prayerTimes.asr, adj.asr),
    maghrib: applyAdjustments(prayerTimes.maghrib, adj.maghrib),
    isha: applyAdjustments(prayerTimes.isha, adj.isha),
  };
}

export function getNextPrayer(
  times: PrayerTimesForDay,
  now: Date = new Date(),
): { id: PrayerId; time: Date; isCurrentWindow: boolean } | null {
  const ordered = PRAYER_IDS.map((id) => ({ id, time: times[id] }));

  for (let i = 0; i < ordered.length; i++) {
    const current = ordered[i];
    const next = ordered[i + 1];

    if (now < current.time) {
      return { id: current.id, time: current.time, isCurrentWindow: false };
    }

    if (next && now >= current.time && now < next.time) {
      return { id: current.id, time: current.time, isCurrentWindow: true };
    }
  }

  return null;
}

export function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale.startsWith("en"),
  });
}

export function getRemainingMs(target: Date, now: Date = new Date()): number {
  return Math.max(0, target.getTime() - now.getTime());
}

export function formatRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
