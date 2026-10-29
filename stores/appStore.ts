import { create } from "zustand";

import {
  loadLocation,
  loadOnboardingComplete,
  loadPrayerLogs,
  loadSettings,
  saveLocation,
  saveOnboardingComplete,
  savePrayerLogs,
  saveSettings,
} from "@/services/persistence/storage";
import { emptyDailyLog, dateKeyFromDate } from "@/services/tracking/prayerLog";
import type { DailyPrayerLog, PrayerId, PrayerStatus } from "@/types/prayer";
import {
  DEFAULT_LOCATION,
  DEFAULT_SETTINGS,
  type AppSettings,
  type StoredLocation,
} from "@/types/settings";

type AppState = {
  hydrated: boolean;
  onboardingComplete: boolean;
  settings: AppSettings;
  location: StoredLocation;
  prayerLogs: Record<string, DailyPrayerLog>;
  toastMessage: string | null;
  hydrate: () => Promise<void>;
  completeOnboarding: (location?: StoredLocation) => Promise<void>;
  setSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setLocation: (location: StoredLocation) => Promise<void>;
  setPrayerStatus: (dateKey: string, prayerId: PrayerId, status: PrayerStatus) => Promise<void>;
  togglePrayerQuick: (dateKey: string, prayerId: PrayerId) => Promise<void>;
  cyclePrayerStatus: (dateKey: string, prayerId: PrayerId) => Promise<void>;
  showToast: (message: string) => void;
  clearToast: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  onboardingComplete: false,
  settings: DEFAULT_SETTINGS,
  location: DEFAULT_LOCATION,
  prayerLogs: {},
  toastMessage: null,

  hydrate: async () => {
    const [settings, location, prayerLogs, onboardingComplete] = await Promise.all([
      loadSettings(),
      loadLocation(),
      loadPrayerLogs(),
      loadOnboardingComplete(),
    ]);

    set({
      hydrated: true,
      settings: settings ?? DEFAULT_SETTINGS,
      location: location ?? DEFAULT_LOCATION,
      prayerLogs: prayerLogs ?? {},
      onboardingComplete: onboardingComplete ?? false,
    });
  },

  completeOnboarding: async (location) => {
    const nextLocation = location ?? get().location;
    set({ onboardingComplete: true, location: nextLocation });
    await Promise.all([saveOnboardingComplete(true), saveLocation(nextLocation)]);
  },

  setSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await saveSettings(settings);
  },

  setLocation: async (location) => {
    set({ location });
    await saveLocation(location);
  },

  setPrayerStatus: async (dateKey, prayerId, status) => {
    const logs = { ...get().prayerLogs };
    const log = logs[dateKey] ?? emptyDailyLog(dateKey);
    logs[dateKey] = {
      ...log,
      prayers: { ...log.prayers, [prayerId]: status },
      updatedAt: new Date().toISOString(),
    };
    set({ prayerLogs: logs });
    await savePrayerLogs(logs);
  },

  togglePrayerQuick: async (dateKey, prayerId) => {
    const logs = get().prayerLogs;
    const log = logs[dateKey] ?? emptyDailyLog(dateKey);
    const current = log.prayers[prayerId];
    const next: PrayerStatus = current === "prayed" ? "not_tracked" : "prayed";
    await get().setPrayerStatus(dateKey, prayerId, next);
  },

  cyclePrayerStatus: async (dateKey, prayerId) => {
    const logs = get().prayerLogs;
    const log = logs[dateKey] ?? emptyDailyLog(dateKey);
    const current = log.prayers[prayerId];
    const order: PrayerStatus[] = ["not_tracked", "prayed", "missed"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await get().setPrayerStatus(dateKey, prayerId, next);
  },

  showToast: (message) => set({ toastMessage: message }),
  clearToast: () => set({ toastMessage: null }),
}));

export function getTodayLog(): DailyPrayerLog {
  const key = dateKeyFromDate(new Date());
  const state = useAppStore.getState();
  return state.prayerLogs[key] ?? emptyDailyLog(key);
}
