import { ensureSchema, getDb } from "@/db/client";
import { studyDeadlines } from "@/db/schema";
import { assertFreshReplace } from "@/db/repositories/safety";
import type { StudyDeadline } from "@/types/deadlines";

function rowToDeadline(row: typeof studyDeadlines.$inferSelect): StudyDeadline {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.dueDate,
    note: row.note ?? undefined,
    done: row.done,
    courseId: row.courseId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getDeadlines(): Promise<StudyDeadline[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(studyDeadlines);
  return rows.map(rowToDeadline).toSorted((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
  });
}

export async function saveDeadlines(items: StudyDeadline[], knownCount = 0): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const existing = await db.select({ id: studyDeadlines.id }).from(studyDeadlines);
  assertFreshReplace({
    resource: "deadlines",
    existingCount: existing.length,
    knownCount,
    incomingCount: items.length,
  });
  await db.delete(studyDeadlines);
  if (items.length === 0) return;
  await db.insert(studyDeadlines).values(
    items.map((d) => ({
      id: d.id,
      title: d.title,
      dueDate: d.dueDate,
      note: d.note ?? null,
      done: d.done,
      courseId: d.courseId ?? null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  );
}
