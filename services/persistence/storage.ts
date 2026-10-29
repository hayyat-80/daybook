import { apiGet, apiPut, isRemoteDbEnabled } from "@/services/persistence/remoteApi";
import type { TimetableSnapshot } from "@/db/repositories/timetable";
import type { DailyPrayerLog } from "@/types/prayer";
import type { AppSettings, StoredLocation } from "@/types/settings";

const PREFIX = "@tracker/";

function localGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function localSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export async function loadSettings(): Promise<AppSettings | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ settings: AppSettings }>("/api/settings");
      return data.settings;
    } catch {
      return localGet<AppSettings>("settings");
    }
  }
  return localGet<AppSettings>("settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/settings", { settings });
      return;
    } catch {
      // fall through
    }
  }
  localSet("settings", settings);
}

export async function loadLocation(): Promise<StoredLocation | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ location: StoredLocation }>("/api/location");
      return data.location;
    } catch {
      return localGet<StoredLocation>("location");
    }
  }
  return localGet<StoredLocation>("location");
}

export async function saveLocation(location: StoredLocation): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/location", { location });
      return;
    } catch {
      // fall through
    }
  }
  localSet("location", location);
}

export async function loadPrayerLogs(): Promise<Record<string, DailyPrayerLog> | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ prayerLogs: Record<string, DailyPrayerLog> }>("/api/prayer-logs");
      return data.prayerLogs;
    } catch {
      return localGet<Record<string, DailyPrayerLog>>("prayer_logs");
    }
  }
  return localGet<Record<string, DailyPrayerLog>>("prayer_logs");
}

export async function savePrayerLogs(prayerLogs: Record<string, DailyPrayerLog>): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/prayer-logs", { prayerLogs });
      return;
    } catch {
      // fall through
    }
  }
  localSet("prayer_logs", prayerLogs);
}

export async function loadOnboardingComplete(): Promise<boolean | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ state: { onboardingComplete: boolean } }>("/api/app-state");
      return data.state.onboardingComplete;
    } catch {
      return localGet<boolean>("onboarding_complete");
    }
  }
  return localGet<boolean>("onboarding_complete");
}

export async function saveOnboardingComplete(onboardingComplete: boolean): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      const current = await apiGet<{
        state: { onboardingComplete: boolean; activeSemesterId: string | null };
      }>("/api/app-state");
      await apiPut("/api/app-state", {
        state: {
          onboardingComplete,
          activeSemesterId: current.state.activeSemesterId,
        },
      });
      return;
    } catch {
      // fall through
    }
  }
  localSet("onboarding_complete", onboardingComplete);
}

export async function loadTimetable(): Promise<TimetableSnapshot | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ timetable: TimetableSnapshot }>("/api/timetable");
      return data.timetable;
    } catch {
      return localGet<TimetableSnapshot>("timetable");
    }
  }
  return localGet<TimetableSnapshot>("timetable");
}

export async function saveTimetable(timetable: TimetableSnapshot): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/timetable", { timetable });
      return;
    } catch {
      // fall through
    }
  }
  localSet("timetable", timetable);
}
