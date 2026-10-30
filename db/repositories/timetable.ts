import { inArray } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { courseSessions, courses, semesterBreaks, semesters } from "@/db/schema";
import { getAppState, saveAppState } from "@/db/repositories/appState";
import { assertFreshReplace } from "@/db/repositories/safety";
import type {
  CourseSession,
  RecurrenceKind,
  Semester,
  SubjectColor,
  TimetableEntry,
  Weekday,
} from "@/types/timetable";

export type TimetableSnapshot = {
  semesters: Semester[];
  activeSemesterId: string | null;
  entries: TimetableEntry[];
};

export async function getTimetableSnapshot(): Promise<TimetableSnapshot> {
  await ensureSchema();
  const db = getDb();
  const [{ activeSemesterId }, semesterRows, breakRows, courseRows, sessionRows] =
    await Promise.all([
      getAppState(),
      db.select().from(semesters),
      db.select().from(semesterBreaks),
      db.select().from(courses),
      db.select().from(courseSessions),
    ]);

  const breaksBySemester = new Map<string, Semester["breaks"]>();
  for (const b of breakRows) {
    const list = breaksBySemester.get(b.semesterId) ?? [];
    list.push({
      id: b.id,
      name: b.name,
      startDate: b.startDate,
      endDate: b.endDate,
    });
    breaksBySemester.set(b.semesterId, list);
  }

  const mappedSemesters: Semester[] = semesterRows.map((s) => ({
    id: s.id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
    breaks: breaksBySemester.get(s.id) ?? [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  const sessionsByCourse = new Map<string, CourseSession[]>();
  for (const s of sessionRows) {
    const list = sessionsByCourse.get(s.courseId) ?? [];
    list.push({
      id: s.id,
      label: s.label,
      room: s.room,
      startTime: s.startTime,
      endTime: s.endTime,
      recurrence: s.recurrence as RecurrenceKind,
      dates: s.datesJson ? (JSON.parse(s.datesJson) as string[]) : undefined,
      weekday: (s.weekday ?? undefined) as Weekday | undefined,
      startDate: s.startDate ?? undefined,
      endDate: s.endDate,
      enabled: s.enabled,
    });
    sessionsByCourse.set(s.courseId, list);
  }

  const entries: TimetableEntry[] = courseRows.map((c) => ({
    id: c.id,
    semesterId: c.semesterId,
    title: c.title,
    color: c.color as SubjectColor,
    sessions: sessionsByCourse.get(c.id) ?? [],
    mandatory: c.mandatory,
    note: c.note ?? undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return {
    semesters: mappedSemesters,
    activeSemesterId,
    entries,
  };
}

export async function saveTimetableSnapshot(
  snapshot: TimetableSnapshot,
  knownEntryCount = 0,
): Promise<void> {
  await ensureSchema();
  const db = getDb();

  const existingCourses = await db.select({ id: courses.id }).from(courses);
  assertFreshReplace({
    resource: "timetable courses",
    existingCount: existingCourses.length,
    knownCount: knownEntryCount,
    incomingCount: snapshot.entries.length,
  });

  const courseIds = existingCourses.map((c) => c.id);

  if (courseIds.length > 0) {
    await db.delete(courseSessions).where(inArray(courseSessions.courseId, courseIds));
  }
  await db.delete(courses);
  await db.delete(semesterBreaks);
  await db.delete(semesters);

  if (snapshot.semesters.length > 0) {
    await db.insert(semesters).values(
      snapshot.semesters.map((s) => ({
        id: s.id,
        name: s.name,
        startDate: s.startDate ?? null,
        endDate: s.endDate ?? null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    );

    const breakValues = snapshot.semesters.flatMap((s) =>
      (s.breaks ?? []).map((b) => ({
        id: b.id,
        semesterId: s.id,
        name: b.name,
        startDate: b.startDate,
        endDate: b.endDate,
      })),
    );
    if (breakValues.length > 0) {
      await db.insert(semesterBreaks).values(breakValues);
    }
  }

  if (snapshot.entries.length > 0) {
    await db.insert(courses).values(
      snapshot.entries.map((e) => ({
        id: e.id,
        semesterId: e.semesterId,
        title: e.title,
        color: e.color,
        mandatory: e.mandatory,
        note: e.note ?? null,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    );

    const sessionValues = snapshot.entries.flatMap((e) =>
      e.sessions.map((s) => ({
        id: s.id,
        courseId: e.id,
        label: s.label,
        room: s.room,
        startTime: s.startTime,
        endTime: s.endTime,
        recurrence: s.recurrence,
        datesJson: s.dates ? JSON.stringify(s.dates) : null,
        weekday: s.weekday ?? null,
        startDate: s.startDate ?? null,
        endDate: s.endDate ?? null,
        enabled: s.enabled,
      })),
    );
    if (sessionValues.length > 0) {
      await db.insert(courseSessions).values(sessionValues);
    }
  }

  const state = await getAppState();
  await saveAppState({
    onboardingComplete: state.onboardingComplete,
    activeSemesterId: snapshot.activeSemesterId,
  });
}
