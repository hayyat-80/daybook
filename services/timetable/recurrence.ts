import dayjs from "dayjs";

import type {
  ClassOccurrence,
  CourseSession,
  RecurrenceKind,
  SemesterBreak,
  TimetableEntry,
  Weekday,
} from "@/types/timetable";

/** JS getDay() Sunday=0 → Monday=0 … Sunday=6 */
export function jsDayToWeekday(jsDay: number): Weekday {
  return ((jsDay + 6) % 7) as Weekday;
}

export function weekdayFromDateKey(dateKey: string): Weekday {
  return jsDayToWeekday(dayjs(dateKey).day());
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function compareOccurrences(a: ClassOccurrence, b: ClassOccurrence): number {
  if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
  return parseTime(a.startTime) - parseTime(b.startTime);
}

function inRange(dateKey: string, start?: string, end?: string | null): boolean {
  if (start && dateKey < start) return false;
  if (end && dateKey > end) return false;
  return true;
}

function weekIndexFrom(startDate: string, dateKey: string): number {
  const start = dayjs(startDate).startOf("day");
  const day = dayjs(dateKey).startOf("day");
  return Math.floor(day.diff(start, "day") / 7);
}

function sessionDates(session: CourseSession): string[] {
  if (session.dates && session.dates.length > 0) {
    return [...session.dates].toSorted();
  }
  return [];
}

export function normalizeRecurrence(value: string | undefined): RecurrenceKind {
  if (value === "once" || !value) return "dates";
  if (value === "dates" || value === "weekly" || value === "biweekly") return value;
  return "dates";
}

export function sessionOccursOnDate(session: CourseSession, dateKey: string): boolean {
  if (!session.enabled) return false;

  const recurrence = normalizeRecurrence(session.recurrence);

  if (recurrence === "dates") {
    return sessionDates(session).includes(dateKey);
  }

  const weekday = session.weekday ?? weekdayFromDateKey(session.startDate ?? dateKey);
  if (weekdayFromDateKey(dateKey) !== weekday) return false;

  const seriesStart = session.startDate ?? sessionDates(session)[0];
  if (!seriesStart) return false;
  if (!inRange(dateKey, seriesStart, session.endDate)) return false;

  if (recurrence === "weekly") return true;

  const idx = weekIndexFrom(seriesStart, dateKey);
  return idx >= 0 && idx % 2 === 0;
}

function toOccurrence(
  entry: TimetableEntry,
  session: CourseSession,
  dateKey: string,
): ClassOccurrence {
  return {
    entryId: entry.id,
    sessionId: session.id,
    title: entry.title,
    sessionLabel: session.label,
    room: session.room,
    startTime: session.startTime,
    endTime: session.endTime,
    color: entry.color,
    dateKey,
    mandatory: entry.mandatory ?? false,
    note: entry.note,
    recurrence: normalizeRecurrence(session.recurrence),
  };
}

export function occurrencesForDate(
  entries: TimetableEntry[],
  dateKey: string,
  breaks?: { startDate: string; endDate: string }[],
): ClassOccurrence[] {
  if (isBreakDay(breaks, dateKey)) return [];

  const result: ClassOccurrence[] = [];
  for (const entry of entries) {
    for (const session of entry.sessions ?? []) {
      if (sessionOccursOnDate(session, dateKey)) {
        result.push(toOccurrence(entry, session, dateKey));
      }
    }
  }
  return result.toSorted(compareOccurrences);
}

/** Monday-start month grid covering the full weeks that touch `anchorDateKey`'s month. */
export function monthDateKeys(anchorDateKey: string): string[] {
  const month = dayjs(anchorDateKey).startOf("month");
  const gridStart = month.subtract(jsDayToWeekday(month.day()), "day");
  const monthEnd = month.endOf("month");
  const gridEnd = monthEnd.add(6 - jsDayToWeekday(monthEnd.day()), "day");
  const keys: string[] = [];
  let cursor = gridStart;
  while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, "day")) {
    keys.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }
  return keys;
}

export function shiftMonth(anchorDateKey: string, deltaMonths: number): string {
  return dayjs(anchorDateKey).add(deltaMonths, "month").date(1).format("YYYY-MM-DD");
}

export function formatMonthLabel(anchorDateKey: string, locale = "en"): string {
  return dayjs(anchorDateKey).toDate().toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function createId(prefix = "tt"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = dayjs(value);
  return d.isValid() && d.format("YYYY-MM-DD") === value;
}

/** Accepts YYYY-MM-DD or D.M.YYYY / D/M/YYYY. Returns canonical YYYY-MM-DD. */
export function parseFlexibleDate(value: string): string | null {
  const trimmed = value.trim();
  if (isValidDateKey(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (!match) return null;

  let year = Number(match[3]);
  if (year < 100) year += 2000;
  const key = `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return isValidDateKey(key) ? key : null;
}

/** DD.MM.YYYY for display. Invalid keys are returned unchanged. */
export function formatDisplayDate(dateKey: string): string {
  if (!isValidDateKey(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split("-");
  return `${day}.${month}.${year}`;
}

export function isBreakDay(
  breaks: { startDate: string; endDate: string }[] | undefined,
  dateKey: string,
): boolean {
  return (breaks ?? []).some((b) => b.startDate <= dateKey && dateKey <= b.endDate);
}

export function breaksOnDate(
  breaks: SemesterBreak[] | undefined,
  dateKey: string,
): SemesterBreak[] {
  return (breaks ?? []).filter((b) => b.startDate <= dateKey && dateKey <= b.endDate);
}
