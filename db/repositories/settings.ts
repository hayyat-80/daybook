import { eq } from "drizzle-orm";

import { ensureSchema, getDb } from "@/db/client";
import { settings } from "@/db/schema";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type CalculationMethodId,
  type HighLatitudeRuleId,
  type MadhabId,
  type NotificationSettings,
  type PrayerAdjustments,
} from "@/types/settings";
import type { AppearanceMode } from "@/design-system/theme";

function rowToSettings(row: typeof settings.$inferSelect): AppSettings {
  return {
    calculationMethod: row.calculationMethod as CalculationMethodId,
    madhab: row.madhab as MadhabId,
    highLatitudeRule: row.highLatitudeRule as HighLatitudeRuleId,
    adjustments: JSON.parse(row.adjustmentsJson) as PrayerAdjustments,
    appearance: row.appearance as AppearanceMode,
    language: row.language as AppSettings["language"],
    hapticFeedback: row.hapticFeedback,
    soundEnabled: row.soundEnabled,
    firstDayOfWeek: row.firstDayOfWeek as 0 | 1,
    autoLocationUpdates: row.autoLocationUpdates,
    notifications: JSON.parse(row.notificationsJson) as NotificationSettings,
  };
}

export async function getSettings(): Promise<AppSettings> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  return rows[0] ? rowToSettings(rows[0]) : DEFAULT_SETTINGS;
}

export async function saveSettings(value: AppSettings): Promise<void> {
  await ensureSchema();
  const db = getDb();
  const updatedAt = new Date().toISOString();
  const payload = {
    id: 1 as const,
    calculationMethod: value.calculationMethod,
    madhab: value.madhab,
    highLatitudeRule: value.highLatitudeRule,
    adjustmentsJson: JSON.stringify(value.adjustments),
    appearance: value.appearance,
    language: value.language,
    hapticFeedback: value.hapticFeedback,
    soundEnabled: value.soundEnabled,
    firstDayOfWeek: value.firstDayOfWeek,
    autoLocationUpdates: value.autoLocationUpdates,
    notificationsJson: JSON.stringify(value.notifications),
    updatedAt,
  };
  await db
    .insert(settings)
    .values(payload)
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...payload },
    });
}
