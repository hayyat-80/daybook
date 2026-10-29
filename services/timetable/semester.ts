import dayjs from "dayjs";

import { createId, parseFlexibleDate } from "@/services/timetable/recurrence";
import type { BreakDraft, Semester, SemesterBreak } from "@/types/timetable";

/**
 * Suggest a German-style semester label from a date.
 * Winter: Oct–Mar → WS YYYY/YY+1
 * Summer: Apr–Sep → SS YYYY
 */
export function suggestSemesterName(reference = new Date()): string {
  const d = dayjs(reference);
  const month = d.month(); // 0–11
  const year = d.year();

  if (month >= 9 || month <= 2) {
    // Oct–Dec: winter of this year; Jan–Mar: winter of previous year
    const startYear = month >= 9 ? year : year - 1;
    const endShort = String(startYear + 1).slice(2);
    return `WS ${startYear}/${endShort}`;
  }

  return `SS ${year}`;
}

export function createSemester(
  name: string,
  options?: {
    startDate?: string | null;
    endDate?: string | null;
    breaks?: SemesterBreak[];
  },
): Semester {
  const now = new Date().toISOString();
  return {
    id: createId("sem"),
    name: name.trim() || suggestSemesterName(),
    startDate: options?.startDate?.trim() || null,
    endDate: options?.endDate?.trim() || null,
    breaks: normalizeSemesterBreaks(options?.breaks),
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeSemesterBreaks(breaks: SemesterBreak[] | undefined): SemesterBreak[] {
  const result: SemesterBreak[] = [];
  for (const item of breaks ?? []) {
    const normalized = normalizeBreak(item.name, item.startDate, item.endDate, item.id);
    if (normalized) result.push(normalized);
  }
  return result.toSorted(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name),
  );
}

function normalizeBreak(
  name: string | undefined,
  startRaw: string | undefined,
  endRaw: string | undefined,
  id?: string,
): SemesterBreak | null {
  const trimmed = name?.trim() ?? "";
  const startDate = parseFlexibleDate(startRaw ?? "");
  const endDate = parseFlexibleDate(endRaw ?? "");
  if (!trimmed || !startDate || !endDate) return null;
  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;
  return { id: id || createId("brk"), name: trimmed, startDate: start, endDate: end };
}

function rangesTouch(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aAfter = dayjs(aEnd).add(1, "day").format("YYYY-MM-DD");
  const bAfter = dayjs(bEnd).add(1, "day").format("YYYY-MM-DD");
  return aStart <= bAfter && bStart <= aAfter;
}

/** Add pasted breaks onto a semester, extending a same-named range that touches. */
export function mergeBreakLists(
  existing: SemesterBreak[],
  incoming: BreakDraft[],
): SemesterBreak[] {
  const next = normalizeSemesterBreaks(existing);
  for (const raw of incoming) {
    const item = normalizeBreak(raw.name, raw.startDate, raw.endDate);
    if (!item) continue;
    const idx = next.findIndex(
      (b) =>
        b.name.trim().toLowerCase() === item.name.toLowerCase() &&
        rangesTouch(b.startDate, b.endDate, item.startDate, item.endDate),
    );
    if (idx === -1) {
      next.push(item);
    } else {
      const current = next[idx];
      next[idx] = {
        ...current,
        startDate: current.startDate < item.startDate ? current.startDate : item.startDate,
        endDate: current.endDate > item.endDate ? current.endDate : item.endDate,
      };
    }
  }
  return next.toSorted(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name),
  );
}
