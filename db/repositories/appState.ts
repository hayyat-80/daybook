import { eq } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { appState } from "@/db/schema";

export type AppStateRow = {
  onboardingComplete: boolean;
  activeSemesterId: string | null;
};

export async function getAppState(userId: string): Promise<AppStateRow> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(appState).where(eq(appState.userId, userId)).limit(1);
  if (!rows[0]) {
    return { onboardingComplete: true, activeSemesterId: null };
  }
  return {
    onboardingComplete: true,
    activeSemesterId: rows[0].activeSemesterId,
  };
}

export async function saveAppState(userId: string, value: AppStateRow): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const payload = {
    userId,
    onboardingComplete: true,
    activeSemesterId: value.activeSemesterId,
  };
  await db
    .insert(appState)
    .values(payload)
    .onConflictDoUpdate({
      target: appState.userId,
      set: { ...payload },
    });
}
