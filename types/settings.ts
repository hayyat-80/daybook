import type { AppearanceMode } from "@/design-system/theme";

export type CalculationMethodId =
  | "MuslimWorldLeague"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Dubai"
  | "MoonsightingCommittee"
  | "NorthAmerica"
  | "Kuwait"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "Turkey";

export type MadhabId = "Shafi" | "Hanafi";

export type HighLatitudeRuleId = "MiddleOfTheNight" | "SeventhOfTheNight" | "TwilightAngle";

export type PrayerAdjustments = {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

export type PrayerNotificationSettings = {
  enabled: boolean;
  minutesBefore: number;
  atTime: boolean;
};

export type NotificationSettings = Record<
  "fajr" | "dhuhr" | "asr" | "maghrib" | "isha",
  PrayerNotificationSettings
> & {
  masterEnabled: boolean;
};

export type StoredLocation = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: string;
  source: "gps" | "manual";
  updatedAt: string;
};

export type AppSettings = {
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
  highLatitudeRule: HighLatitudeRuleId;
  adjustments: PrayerAdjustments;
  appearance: AppearanceMode;
  language: "en" | "ar" | "de";
  hapticFeedback: boolean;
  soundEnabled: boolean;
  firstDayOfWeek: 0 | 1;
  autoLocationUpdates: boolean;
  notifications: NotificationSettings;
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  masterEnabled: true,
  fajr: { enabled: true, minutesBefore: 10, atTime: true },
  dhuhr: { enabled: true, minutesBefore: 5, atTime: true },
  asr: { enabled: true, minutesBefore: 10, atTime: true },
  maghrib: { enabled: true, minutesBefore: 5, atTime: true },
  isha: { enabled: true, minutesBefore: 10, atTime: true },
};

export const DEFAULT_SETTINGS: AppSettings = {
  calculationMethod: "MuslimWorldLeague",
  madhab: "Shafi",
  highLatitudeRule: "MiddleOfTheNight",
  adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  appearance: "system",
  language: "en",
  hapticFeedback: true,
  soundEnabled: true,
  firstDayOfWeek: 1,
  autoLocationUpdates: true,
  notifications: DEFAULT_NOTIFICATIONS,
};

/** Default fallback: Chemnitz, Germany */
export const DEFAULT_LOCATION: StoredLocation = {
  latitude: 50.8278,
  longitude: 12.9214,
  city: "Chemnitz",
  country: "Germany",
  timezone: "Europe/Berlin",
  source: "manual",
  updatedAt: new Date().toISOString(),
};
