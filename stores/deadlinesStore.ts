import { create } from "zustand";

import { loadDeadlines, saveDeadlines } from "@/services/persistence/storage";
import { createId, parseFlexibleDate } from "@/services/timetable/recurrence";
import type { DeadlineDraft, StudyDeadline } from "@/types/deadlines";

type DeadlinesState = {
  hydrated: boolean;
  items: StudyDeadline[];
  hydrate: () => Promise<void>;
  add: (draft: DeadlineDraft) => Promise<void>;
  update: (id: string, draft: DeadlineDraft) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

function sortItems(items: StudyDeadline[]): StudyDeadline[] {
  return items.toSorted((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
  });
}

async function persist(items: StudyDeadline[]) {
  await saveDeadlines(items);
}

export const useDeadlinesStore = create<DeadlinesState>((set, get) => ({
  hydrated: false,
  items: [],

  hydrate: async () => {
    const loaded = await loadDeadlines();
    set({ items: sortItems(loaded ?? []), hydrated: true });
  },

  add: async (draft) => {
    const dueDate = parseFlexibleDate(draft.dueDate);
    if (!dueDate || !draft.title.trim()) return;
    const now = new Date().toISOString();
    const next: StudyDeadline = {
      id: createId("dl"),
      title: draft.title.trim(),
      dueDate,
      note: draft.note.trim() || undefined,
      done: false,
      courseId: draft.courseId || null,
      createdAt: now,
      updatedAt: now,
    };
    const items = sortItems([...get().items, next]);
    set({ items });
    await persist(items);
  },

  update: async (id, draft) => {
    const dueDate = parseFlexibleDate(draft.dueDate);
    if (!dueDate || !draft.title.trim()) return;
    const now = new Date().toISOString();
    const items = sortItems(
      get().items.map((d) =>
        d.id === id
          ? {
              ...d,
              title: draft.title.trim(),
              dueDate,
              note: draft.note.trim() || undefined,
              courseId: draft.courseId || null,
              updatedAt: now,
            }
          : d,
      ),
    );
    set({ items });
    await persist(items);
  },

  toggleDone: async (id) => {
    const now = new Date().toISOString();
    const items = sortItems(
      get().items.map((d) => (d.id === id ? { ...d, done: !d.done, updatedAt: now } : d)),
    );
    set({ items });
    await persist(items);
  },

  remove: async (id) => {
    const items = get().items.filter((d) => d.id !== id);
    set({ items });
    await persist(items);
  },
}));
