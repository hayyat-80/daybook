import type { Client } from "@libsql/client";

import { dataOwnerEmail } from "@/db/owner";

async function columnNames(client: Client, table: string): Promise<Set<string>> {
  const rs = await client.execute(`PRAGMA table_info(${table})`);
  const names = new Set<string>();
  for (const row of rs.rows) {
    const name = String(row.name ?? row[1] ?? "");
    if (name) names.add(name);
  }
  return names;
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const rs = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    args: [table],
  });
  return rs.rows.length > 0;
}

async function resolveOwnerId(client: Client): Promise<string | null> {
  const email = dataOwnerEmail();
  const rs = await client.execute({
    sql: `SELECT id FROM users WHERE email = ? LIMIT 1`,
    args: [email],
  });
  const id = rs.rows[0]?.id ?? rs.rows[0]?.[0];
  return id ? String(id) : null;
}

/**
 * Rebuild legacy singleton / unscoped tables so every row belongs to a user.
 * Safe to run repeatedly.
 */
export async function migrateUserScope(client: Client): Promise<void> {
  const ownerId = await resolveOwnerId(client);
  if (!ownerId) return;

  // --- settings: id INTEGER PK → user_id TEXT PK ---
  if (await tableExists(client, "settings")) {
    const cols = await columnNames(client, "settings");
    if (cols.has("id") && !cols.has("user_id")) {
      await client.execute(`CREATE TABLE IF NOT EXISTS settings_user (
        user_id TEXT PRIMARY KEY NOT NULL,
        calculation_method TEXT NOT NULL,
        madhab TEXT NOT NULL,
        high_latitude_rule TEXT NOT NULL,
        adjustments_json TEXT NOT NULL,
        appearance TEXT NOT NULL,
        language TEXT NOT NULL,
        haptic_feedback INTEGER NOT NULL,
        sound_enabled INTEGER NOT NULL,
        first_day_of_week INTEGER NOT NULL,
        auto_location_updates INTEGER NOT NULL,
        notifications_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await client.execute({
        sql: `INSERT OR IGNORE INTO settings_user (
          user_id, calculation_method, madhab, high_latitude_rule, adjustments_json,
          appearance, language, haptic_feedback, sound_enabled, first_day_of_week,
          auto_location_updates, notifications_json, updated_at
        )
        SELECT ?, calculation_method, madhab, high_latitude_rule, adjustments_json,
          appearance, language, haptic_feedback, sound_enabled, first_day_of_week,
          auto_location_updates, notifications_json, updated_at
        FROM settings WHERE id = 1`,
        args: [ownerId],
      });
      await client.execute(`DROP TABLE settings`);
      await client.execute(`ALTER TABLE settings_user RENAME TO settings`);
    }
  }

  // --- location ---
  if (await tableExists(client, "location")) {
    const cols = await columnNames(client, "location");
    if (cols.has("id") && !cols.has("user_id")) {
      await client.execute(`CREATE TABLE IF NOT EXISTS location_user (
        user_id TEXT PRIMARY KEY NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        timezone TEXT NOT NULL,
        source TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      await client.execute({
        sql: `INSERT OR IGNORE INTO location_user (
          user_id, latitude, longitude, city, country, timezone, source, updated_at
        )
        SELECT ?, latitude, longitude, city, country, timezone, source, updated_at
        FROM location WHERE id = 1`,
        args: [ownerId],
      });
      await client.execute(`DROP TABLE location`);
      await client.execute(`ALTER TABLE location_user RENAME TO location`);
    }
  }

  // --- app_state ---
  if (await tableExists(client, "app_state")) {
    const cols = await columnNames(client, "app_state");
    if (cols.has("id") && !cols.has("user_id")) {
      await client.execute(`CREATE TABLE IF NOT EXISTS app_state_user (
        user_id TEXT PRIMARY KEY NOT NULL,
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        active_semester_id TEXT
      )`);
      await client.execute({
        sql: `INSERT OR IGNORE INTO app_state_user (user_id, onboarding_complete, active_semester_id)
        SELECT ?, onboarding_complete, active_semester_id FROM app_state WHERE id = 1`,
        args: [ownerId],
      });
      await client.execute(`DROP TABLE app_state`);
      await client.execute(`ALTER TABLE app_state_user RENAME TO app_state`);
    }
  }

  // --- prayer_logs: date_key PK → (user_id, date_key) ---
  if (await tableExists(client, "prayer_logs")) {
    const cols = await columnNames(client, "prayer_logs");
    if (!cols.has("user_id")) {
      await client.execute(`CREATE TABLE IF NOT EXISTS prayer_logs_user (
        user_id TEXT NOT NULL,
        date_key TEXT NOT NULL,
        fajr TEXT NOT NULL,
        dhuhr TEXT NOT NULL,
        asr TEXT NOT NULL,
        maghrib TEXT NOT NULL,
        isha TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, date_key)
      )`);
      await client.execute({
        sql: `INSERT OR IGNORE INTO prayer_logs_user (
          user_id, date_key, fajr, dhuhr, asr, maghrib, isha, updated_at
        )
        SELECT ?, date_key, fajr, dhuhr, asr, maghrib, isha, updated_at FROM prayer_logs`,
        args: [ownerId],
      });
      await client.execute(`DROP TABLE prayer_logs`);
      await client.execute(`ALTER TABLE prayer_logs_user RENAME TO prayer_logs`);
    }
  }

  // --- semesters / courses / deadlines: add user_id + backfill ---
  for (const table of ["semesters", "courses", "study_deadlines"] as const) {
    if (!(await tableExists(client, table))) continue;
    const cols = await columnNames(client, table);
    if (!cols.has("user_id")) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`);
      await client.execute({
        sql: `UPDATE ${table} SET user_id = ? WHERE user_id IS NULL OR user_id = ''`,
        args: [ownerId],
      });
    } else {
      await client.execute({
        sql: `UPDATE ${table} SET user_id = ? WHERE user_id IS NULL OR user_id = ''`,
        args: [ownerId],
      });
    }
  }
}
