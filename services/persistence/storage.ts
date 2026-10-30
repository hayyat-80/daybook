import { apiGet, apiPut, isRemoteDbEnabled } from "@/services/persistence/remoteApi";
import type { LoadResult } from "@/services/persistence/loadResult";
import type { TimetableSnapshot } from "@/db/repositories/timetable";
import type { StudyDeadline } from "@/types/deadlines";
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

export async function loadPrayerLogs(): Promise<LoadResult<Record<string, DailyPrayerLog>> | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ prayerLogs: Record<string, DailyPrayerLog> }>("/api/prayer-logs");
      return { data: data.prayerLogs ?? {}, source: "remote" };
    } catch {
      const local = localGet<Record<string, DailyPrayerLog>>("prayer_logs");
      return local ? { data: local, source: "local-fallback" } : null;
    }
  }
  const local = localGet<Record<string, DailyPrayerLog>>("prayer_logs");
  return local ? { data: local, source: "local" } : { data: {}, source: "local" };
}

export async function savePrayerLogs(
  prayerLogs: Record<string, DailyPrayerLog>,
  knownDayCount: number,
): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/prayer-logs", { prayerLogs, knownDayCount });
      localSet("prayer_logs", prayerLogs);
      return;
    } catch {
      // fall through — do not treat a rejected stale write as license to clobber local only
      throw new Error("Failed to save prayer logs to remote");
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

export async function loadTimetable(): Promise<LoadResult<TimetableSnapshot> | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ timetable: TimetableSnapshot }>("/api/timetable");
      return { data: data.timetable, source: "remote" };
    } catch {
      const local = localGet<TimetableSnapshot>("timetable");
      return local ? { data: local, source: "local-fallback" } : null;
    }
  }
  const local = localGet<TimetableSnapshot>("timetable");
  return local
    ? { data: local, source: "local" }
    : {
        data: { semesters: [], activeSemesterId: null, entries: [] },
        source: "local",
      };
}

export async function saveTimetable(
  timetable: TimetableSnapshot,
  knownEntryCount: number,
): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/timetable", { timetable, knownEntryCount });
      localSet("timetable", timetable);
      return;
    } catch {
      throw new Error("Failed to save timetable to remote");
    }
  }
  localSet("timetable", timetable);
}

export async function loadDeadlines(): Promise<LoadResult<StudyDeadline[]> | null> {
  if (isRemoteDbEnabled()) {
    try {
      const data = await apiGet<{ deadlines: StudyDeadline[] }>("/api/deadlines");
      return { data: data.deadlines ?? [], source: "remote" };
    } catch {
      const local = localGet<StudyDeadline[]>("study_deadlines");
      return local ? { data: local, source: "local-fallback" } : null;
    }
  }
  const local = localGet<StudyDeadline[]>("study_deadlines");
  return { data: local ?? [], source: "local" };
}

export async function saveDeadlines(
  deadlines: StudyDeadline[],
  knownCount: number,
): Promise<void> {
  if (isRemoteDbEnabled()) {
    try {
      await apiPut("/api/deadlines", { deadlines, knownCount });
      localSet("study_deadlines", deadlines);
      return;
    } catch {
      throw new Error("Failed to save deadlines to remote");
    }
  }
  localSet("study_deadlines", deadlines);
}
