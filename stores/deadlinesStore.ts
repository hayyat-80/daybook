import { create } from "zustand";

import { canPersistToRemote } from "@/services/persistence/loadResult";
import { loadDeadlines, saveDeadlines } from "@/services/persistence/storage";
import { createId, parseFlexibleDate } from "@/services/timetable/recurrence";
import type { DeadlineDraft, StudyDeadline } from "@/types/deadlines";

type DeadlinesState = {
  hydrated: boolean;
  canPersist: boolean;
  knownCount: number;
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
  const { canPersist, knownCount } = useDeadlinesStore.getState();
  if (!canPersist) return;
  await saveDeadlines(items, knownCount);
  useDeadlinesStore.setState({ knownCount: items.length });
}

export const useDeadlinesStore = create<DeadlinesState>((set, get) => ({
  hydrated: false,
  canPersist: false,
  knownCount: 0,
  items: [],

  hydrate: async () => {
    const loaded = await loadDeadlines();
    if (!loaded) {
      set({ hydrated: true, canPersist: false, knownCount: 0, items: [] });
      return;
    }
    const items = sortItems(loaded.data);
    set({
      hydrated: true,
      canPersist: canPersistToRemote(loaded.source),
      knownCount: items.length,
      items,
    });
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
