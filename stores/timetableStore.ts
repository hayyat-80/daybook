import { create } from "zustand";

import { canPersistToRemote } from "@/services/persistence/loadResult";
import { loadTimetable, saveTimetable } from "@/services/persistence/storage";
import {
  createId,
  formatDisplayDate,
  normalizeRecurrence,
  parseFlexibleDate,
  weekdayFromDateKey,
} from "@/services/timetable/recurrence";
import {
  createSemester,
  mergeBreakLists,
  normalizeSemesterBreaks,
  suggestSemesterName,
} from "@/services/timetable/semester";
import type {
  BreakDraft,
  CourseSession,
  Semester,
  SemesterDraft,
  SessionDraft,
  TimetableDraft,
  TimetableEntry,
} from "@/types/timetable";
import { SUBJECT_COLORS } from "@/types/timetable";

type TimetableState = {
  hydrated: boolean;
  /** False when hydrate used stale local fallback — never write that to Turso. */
  canPersist: boolean;
  /** Course count from the last successful authoritative load / save. */
  knownEntryCount: number;
  semesters: Semester[];
  activeSemesterId: string | null;
  entries: TimetableEntry[];
  hydrate: () => Promise<void>;
  /** Courses for the active semester only */
  activeEntries: () => TimetableEntry[];
  setActiveSemester: (id: string) => Promise<void>;
  addSemester: (draft: SemesterDraft) => Promise<Semester>;
  updateSemester: (id: string, draft: SemesterDraft) => Promise<void>;
  /** Fold pasted breaks into a semester without duplicating an overlapping range. */
  mergeSemesterBreaks: (semesterId: string, incoming: BreakDraft[]) => Promise<void>;
  removeSemester: (id: string) => Promise<void>;
  addEntry: (draft: TimetableDraft) => Promise<TimetableEntry>;
  updateEntry: (id: string, draft: TimetableDraft) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => TimetableEntry | undefined;
};

function dayKeyNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sessionDraftToSession(draft: SessionDraft): CourseSession {
  const recurrence = normalizeRecurrence(draft.recurrence);
  const base: CourseSession = {
    id: draft.id || createId("ses"),
    label: draft.label.trim() || "Session",
    room: draft.room.trim(),
    startTime: draft.startTime.trim(),
    endTime: draft.endTime.trim(),
    recurrence,
    enabled: draft.enabled,
  };

  if (recurrence === "dates") {
    const dates = [
      ...new Set(
        draft.dates.map((d) => parseFlexibleDate(d.trim())).filter((d): d is string => Boolean(d)),
      ),
    ].toSorted();
    return {
      ...base,
      dates,
      weekday: undefined,
      startDate: dates[0],
      endDate: dates[dates.length - 1] ?? null,
    };
  }

  const startDate = parseFlexibleDate(draft.startDate) ?? draft.startDate;
  return {
    ...base,
    dates: undefined,
    weekday: draft.weekday ?? (startDate ? weekdayFromDateKey(startDate) : undefined),
    startDate,
    endDate: draft.endDate.trim()
      ? (parseFlexibleDate(draft.endDate) ?? draft.endDate.trim())
      : null,
  };
}

function draftToEntry(
  draft: TimetableDraft,
  semesterId: string,
  existing?: TimetableEntry,
): TimetableEntry {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId("crs"),
    semesterId: existing?.semesterId ?? semesterId,
    title: draft.title.trim(),
    color: draft.color,
    sessions: draft.sessions.map(sessionDraftToSession),
    mandatory: draft.mandatory,
    note: draft.note.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function migrateEntry(raw: TimetableEntry, fallbackSemesterId: string): TimetableEntry {
  const semesterId = raw.semesterId || fallbackSemesterId;

  if (raw.sessions && raw.sessions.length > 0) {
    return {
      ...raw,
      semesterId,
      sessions: raw.sessions.map((s) => ({
        ...s,
        recurrence: normalizeRecurrence(s.recurrence),
        enabled: s.enabled ?? true,
        dates:
          normalizeRecurrence(s.recurrence) === "dates"
            ? [...new Set(s.dates ?? [])].toSorted()
            : undefined,
      })),
      mandatory: raw.mandatory ?? false,
      room: undefined,
      startTime: undefined,
      endTime: undefined,
      recurrence: undefined,
      dates: undefined,
      dateKey: undefined,
      weekday: undefined,
      startDate: undefined,
      endDate: undefined,
    };
  }

  const recurrence = normalizeRecurrence(raw.recurrence);
  let dates = raw.dates ?? [];
  if (dates.length === 0 && raw.dateKey) dates = [raw.dateKey];

  const session: CourseSession = {
    id: createId("ses"),
    label: "Class",
    room: raw.room ?? "",
    startTime: raw.startTime ?? "09:15",
    endTime: raw.endTime ?? "10:45",
    recurrence,
    enabled: true,
    dates: recurrence === "dates" ? [...new Set(dates)].toSorted() : undefined,
    weekday: raw.weekday,
    startDate: raw.startDate ?? dates[0],
    endDate: raw.endDate ?? null,
  };

  return {
    id: raw.id,
    semesterId,
    title: raw.title,
    color: raw.color,
    sessions: [session],
    mandatory: raw.mandatory ?? false,
    note: raw.note,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

async function persistAll(state: {
  semesters: Semester[];
  activeSemesterId: string | null;
  entries: TimetableEntry[];
}) {
  const { canPersist, knownEntryCount } = useTimetableStore.getState();
  if (!canPersist) return;
  await saveTimetable(state, knownEntryCount);
  useTimetableStore.setState({ knownEntryCount: state.entries.length });
}

export function emptySessionDraft(todayKey: string, label = "Lecture"): SessionDraft {
  return {
    id: createId("ses"),
    label,
    room: "",
    startTime: "09:15",
    endTime: "10:45",
    recurrence: "weekly",
    dates: [],
    weekday: null,
    startDate: formatDisplayDate(todayKey),
    endDate: "",
    enabled: true,
  };
}

export function emptyDraft(todayKey: string): TimetableDraft {
  return {
    title: "",
    color: SUBJECT_COLORS[0],
    mandatory: false,
    note: "",
    sessions: [emptySessionDraft(todayKey, "Lecture")],
    breaks: [],
  };
}

function sessionToDraft(session: CourseSession): SessionDraft {
  const today = dayKeyNow();
  return {
    id: session.id,
    label: session.label,
    room: session.room,
    startTime: session.startTime,
    endTime: session.endTime,
    recurrence: normalizeRecurrence(session.recurrence),
    dates: session.dates ?? [],
    weekday: session.weekday ?? null,
    startDate: formatDisplayDate(session.startDate ?? today),
    endDate: session.endDate ? formatDisplayDate(session.endDate) : "",
    enabled: session.enabled ?? true,
  };
}

export function entryToDraft(entry: TimetableEntry): TimetableDraft {
  const migrated = migrateEntry(entry, entry.semesterId || "legacy");
  return {
    title: migrated.title,
    color: migrated.color,
    mandatory: migrated.mandatory ?? false,
    note: migrated.note ?? "",
    sessions: migrated.sessions.map(sessionToDraft),
    breaks: [],
  };
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  hydrated: false,
  canPersist: false,
  knownEntryCount: 0,
  semesters: [],
  activeSemesterId: null,
  entries: [],

  hydrate: async () => {
    const loaded = await loadTimetable();

    // Load failed — ephemeral UI only. Never write back.
    if (!loaded) {
      const semester = createSemester(suggestSemesterName());
      set({
        hydrated: true,
        canPersist: false,
        knownEntryCount: 0,
        semesters: [semester],
        activeSemesterId: semester.id,
        entries: [],
      });
      return;
    }

    const { data: snapshot, source } = loaded;
    const canPersist = canPersistToRemote(source);

    let semesters = (snapshot.semesters ?? []).map((semester) => ({
      ...semester,
      breaks: normalizeSemesterBreaks(semester.breaks),
    }));
    const needsBootstrap = semesters.length === 0;
    if (needsBootstrap) {
      semesters = [createSemester(suggestSemesterName())];
    }

    const rawActiveId = snapshot.activeSemesterId ?? null;
    const activeSemesterId =
      rawActiveId && semesters.some((s) => s.id === rawActiveId) ? rawActiveId : semesters[0].id;

    const fallbackId = activeSemesterId;
    const entries = (snapshot.entries ?? []).map((e) => migrateEntry(e, fallbackId));

    set({
      hydrated: true,
      canPersist,
      knownEntryCount: entries.length,
      semesters,
      activeSemesterId,
      entries,
    });

    // First-run empty remote DB only — never on local-fallback.
    if (needsBootstrap && canPersist) {
      await persistAll({ semesters, activeSemesterId, entries });
    }
  },

  activeEntries: () => {
    const { entries, activeSemesterId } = get();
    if (!activeSemesterId) return entries;
    return entries.filter((e) => e.semesterId === activeSemesterId);
  },

  setActiveSemester: async (id) => {
    if (!get().semesters.some((s) => s.id === id)) return;
    set({ activeSemesterId: id });
    await persistAll({
      semesters: get().semesters,
      activeSemesterId: id,
      entries: get().entries,
    });
  },

  addSemester: async (draft) => {
    const semester = createSemester(draft.name, {
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      breaks: draft.breaks,
    });
    const semesters = [...get().semesters, semester];
    set({ semesters, activeSemesterId: semester.id });
    await persistAll({
      semesters,
      activeSemesterId: semester.id,
      entries: get().entries,
    });
    return semester;
  },

  updateSemester: async (id, draft) => {
    const semesters = get().semesters.map((s) =>
      s.id === id
        ? {
            ...s,
            name: draft.name.trim() || s.name,
            startDate: draft.startDate.trim() || null,
            endDate: draft.endDate.trim() || null,
            breaks: normalizeSemesterBreaks(draft.breaks),
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    set({ semesters });
    await persistAll({
      semesters,
      activeSemesterId: get().activeSemesterId,
      entries: get().entries,
    });
  },

  mergeSemesterBreaks: async (semesterId, incoming) => {
    if (incoming.length === 0) return;
    const semesters = get().semesters.map((semester) =>
      semester.id === semesterId
        ? {
            ...semester,
            breaks: mergeBreakLists(semester.breaks ?? [], incoming),
            updatedAt: new Date().toISOString(),
          }
        : semester,
    );
    set({ semesters });
    await persistAll({
      semesters,
      activeSemesterId: get().activeSemesterId,
      entries: get().entries,
    });
  },

  removeSemester: async (id) => {
    const { semesters, entries, activeSemesterId } = get();
    if (semesters.length <= 1) return;

    const nextSemesters = semesters.filter((s) => s.id !== id);
    const nextEntries = entries.filter((e) => e.semesterId !== id);
    const nextActive = activeSemesterId === id ? nextSemesters[0].id : activeSemesterId;

    set({
      semesters: nextSemesters,
      entries: nextEntries,
      activeSemesterId: nextActive,
    });
    await persistAll({
      semesters: nextSemesters,
      activeSemesterId: nextActive,
      entries: nextEntries,
    });
  },

  addEntry: async (draft) => {
    const semesterId = get().activeSemesterId;
    if (!semesterId) throw new Error("No active semester");
    const entry = draftToEntry(draft, semesterId);
    const entries = [...get().entries, entry];
    set({ entries });
    await persistAll({
      semesters: get().semesters,
      activeSemesterId: get().activeSemesterId,
      entries,
    });
    return entry;
  },

  updateEntry: async (id, draft) => {
    const existing = get().entries.find((e) => e.id === id);
    if (!existing) return;
    const next = draftToEntry(draft, existing.semesterId, existing);
    const entries = get().entries.map((e) => (e.id === id ? next : e));
    set({ entries });
    await persistAll({
      semesters: get().semesters,
      activeSemesterId: get().activeSemesterId,
      entries,
    });
  },

  removeEntry: async (id) => {
    const entries = get().entries.filter((e) => e.id !== id);
    set({ entries });
    await persistAll({
      semesters: get().semesters,
      activeSemesterId: get().activeSemesterId,
      entries,
    });
  },

  getEntry: (id) => get().entries.find((e) => e.id === id),
}));
