/** Monday = 0 … Sunday = 6 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Specific dates, weekly, or every two weeks */
export type RecurrenceKind = "dates" | "weekly" | "biweekly";

/** Legacy value from earlier builds — migrated on hydrate */
export type LegacyRecurrenceKind = RecurrenceKind | "once";

export const SUBJECT_COLORS = [
  "#2A9D8F",
  "#2563EB",
  "#7C3AED",
  "#C2410C",
  "#BE123C",
  "#0F766E",
  "#B45309",
  "#4338CA",
] as const;

export type SubjectColor = (typeof SUBJECT_COLORS)[number];

/** A holiday or break. Classes are hidden on these days. */
export type BreakDraft = {
  name: string;
  /** Inclusive YYYY-MM-DD */
  startDate: string;
  /** Inclusive YYYY-MM-DD */
  endDate: string;
};

export type SemesterBreak = BreakDraft & {
  id: string;
};

/** Academic term that owns a set of courses */
export type Semester = {
  id: string;
  /** e.g. "WS 2026/27", "SS 2027" */
  name: string;
  /** Optional term bounds (YYYY-MM-DD) */
  startDate?: string | null;
  endDate?: string | null;
  breaks: SemesterBreak[];
  createdAt: string;
  updatedAt: string;
};

/**
 * One scheduled slot of a course — e.g. Lecture vs Exercise group 3.
 * Each can have its own day, time, and room.
 */
export type CourseSession = {
  id: string;
  /** e.g. "Lecture", "Exercise group 1" */
  label: string;
  room: string;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
  recurrence: RecurrenceKind;
  dates?: string[];
  weekday?: Weekday;
  startDate?: string;
  endDate?: string | null;
  /**
   * Include in schedule. Turn off exercise groups you don't attend
   * while keeping them saved for reference.
   */
  enabled: boolean;
};

/** A course that can contain many sessions (lecture + exercise groups, …). */
export type TimetableEntry = {
  id: string;
  /** Which semester this course belongs to */
  semesterId: string;
  title: string;
  color: SubjectColor;
  sessions: CourseSession[];
  mandatory: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;

  // —— Legacy flat fields (migrated into sessions[0] on hydrate) ——
  room?: string;
  startTime?: string;
  endTime?: string;
  recurrence?: LegacyRecurrenceKind;
  dates?: string[];
  dateKey?: string;
  weekday?: Weekday;
  startDate?: string;
  endDate?: string | null;
};

/** Concrete class instance on a calendar day */
export type ClassOccurrence = {
  entryId: string;
  sessionId: string;
  title: string;
  sessionLabel: string;
  room: string;
  startTime: string;
  endTime: string;
  color: SubjectColor;
  dateKey: string;
  mandatory: boolean;
  note?: string;
  recurrence: RecurrenceKind;
};

export type SessionDraft = {
  id: string;
  label: string;
  room: string;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceKind;
  dates: string[];
  weekday: Weekday;
  startDate: string;
  endDate: string;
  enabled: boolean;
};

export type TimetableDraft = {
  title: string;
  color: SubjectColor;
  mandatory: boolean;
  note: string;
  sessions: SessionDraft[];
  /** Breaks parsed from a pasted plan. Merged into the semester on save. */
  breaks: BreakDraft[];
};

export type SemesterDraft = {
  name: string;
  startDate: string;
  endDate: string;
  breaks: SemesterBreak[];
};
