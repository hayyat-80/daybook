import { eq } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { appState } from "@/db/schema";

export type AppStateRow = {
  onboardingComplete: boolean;
  activeSemesterId: string | null;
};

export async function getAppState(): Promise<AppStateRow> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(appState).where(eq(appState.id, 1)).limit(1);
  if (!rows[0]) {
    return { onboardingComplete: true, activeSemesterId: null };
  }
  return {
    onboardingComplete: true,
    activeSemesterId: rows[0].activeSemesterId,
  };
}

export async function saveAppState(value: AppStateRow): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const payload = {
    id: 1 as const,
    onboardingComplete: true,
    activeSemesterId: value.activeSemesterId,
  };
  await db
    .insert(appState)
    .values(payload)
    .onConflictDoUpdate({
      target: appState.id,
      set: { ...payload },
    });
}
