import dayjs from "dayjs";

import { parseFlexibleDate } from "@/services/timetable/recurrence";
import type { BreakDraft } from "@/types/timetable";

export type ParsedSessionGroup = {
  label: string;
  room: string;
  dates: string[];
};

export type ParsedPlan = {
  sessions: ParsedSessionGroup[];
  breaks: BreakDraft[];
  /** Non-empty lines that were not a date plus a description. */
  skipped: number;
};

/**
 * Weekly slots with the same label a week apart (Christmas listed on two Mondays)
 * become one inclusive range covering the days in between.
 */
const BREAK_GAP_DAYS = 7;

const BREAK_RE =
  /(break|holiday|vacation|closure|ferien|feiertag|urlaub|vorlesungsfrei|entf[aä]llt|no class|cancell?ed|عطلة|إجازة)/i;

const LINE_RE = /^(\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2})\s*[-–:]?\s+(.+)$/;

function splitRoom(text: string): { label: string; room: string } {
  const match = text.trim().match(/^(.*)\(([^()]*)\)\s*$/);
  if (!match) return { label: text.trim(), room: "" };
  return { label: match[1].trim(), room: match[2].trim() };
}

/** Sunday of the week that contains dateKey. Weeks start on Monday. */
function endOfTeachingWeek(dateKey: string): string {
  const day = dayjs(dateKey);
  const daysUntilSunday = day.day() === 0 ? 0 : 7 - day.day();
  return day.add(daysUntilSunday, "day").format("YYYY-MM-DD");
}

function rangesFromDates(dates: string[]): { startDate: string; endDate: string }[] {
  const sorted = [...new Set(dates)].toSorted();
  const ranges: { startDate: string; endDate: string }[] = [];
  for (const date of sorted) {
    const last = ranges[ranges.length - 1];
    if (!last) {
      ranges.push({ startDate: date, endDate: date });
      continue;
    }
    const gap = dayjs(date).diff(dayjs(last.endDate), "day");
    if (gap <= BREAK_GAP_DAYS) last.endDate = date;
    else ranges.push({ startDate: date, endDate: date });
  }
  return ranges.map((range) =>
    range.startDate === range.endDate
      ? range
      : { ...range, endDate: endOfTeachingWeek(range.endDate) },
  );
}

/**
 * Turn a pasted weekly plan into date-based sessions plus semester breaks.
 *
 * Each line is `12.10.2026  In-presence class (A10.204)`.
 * Lines whose description is a break or holiday are not scheduled.
 * Same label and room are grouped into one session.
 */
export function parseWeeklyPlan(text: string): ParsedPlan {
  const sessions = new Map<string, ParsedSessionGroup>();
  const sessionOrder: string[] = [];
  const breakDates = new Map<string, { name: string; dates: string[] }>();
  let skipped = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(LINE_RE);
    const dateKey = match ? parseFlexibleDate(match[1]) : null;
    if (!match || !dateKey) {
      skipped += 1;
      continue;
    }

    const description = match[2].trim();
    if (BREAK_RE.test(description)) {
      const name = splitRoom(description).label || description;
      const key = name.toLowerCase();
      const existing = breakDates.get(key);
      if (existing) existing.dates.push(dateKey);
      else breakDates.set(key, { name, dates: [dateKey] });
      continue;
    }

    const { label, room } = splitRoom(description);
    const sessionLabel = label || description;
    const key = `${sessionLabel.toLowerCase()}|||${room.toLowerCase()}`;
    const existing = sessions.get(key);
    if (existing) {
      existing.dates.push(dateKey);
    } else {
      sessions.set(key, { label: sessionLabel, room, dates: [dateKey] });
      sessionOrder.push(key);
    }
  }

  const parsedSessions = sessionOrder
    .map((key) => {
      const group = sessions.get(key)!;
      return { ...group, dates: [...new Set(group.dates)].toSorted() };
    })
    .toSorted((a, b) => a.dates[0].localeCompare(b.dates[0]));

  const breaks: BreakDraft[] = [];
  for (const group of breakDates.values()) {
    for (const range of rangesFromDates(group.dates)) {
      breaks.push({ name: group.name, ...range });
    }
  }

  return {
    sessions: parsedSessions,
    breaks: breaks.toSorted((a, b) => a.startDate.localeCompare(b.startDate)),
    skipped,
  };
}
