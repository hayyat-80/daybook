import { config as loadEnv } from "dotenv";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import { migrateUserScope } from "@/db/migrateUserScope";
import * as schema from "./schema";

loadEnv({ quiet: true });

type Db = LibSQLDatabase<typeof schema>;

let cached: { db: Db; client: Client } | null = null;
let schemaReady = false;

function ensureClient(): Client {
  if (cached) return cached.client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }

  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  cached = {
    client,
    db: drizzle(client, { schema }),
  };
  return client;
}

export function getDb(): Db {
  ensureClient();
  return cached!.db;
}

export function getClient(): Client {
  return ensureClient();
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
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
  )`,
  `CREATE TABLE IF NOT EXISTS location (
    user_id TEXT PRIMARY KEY NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    source TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS app_state (
    user_id TEXT PRIMARY KEY NOT NULL,
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    active_semester_id TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS prayer_logs (
    user_id TEXT NOT NULL,
    date_key TEXT NOT NULL,
    fajr TEXT NOT NULL,
    dhuhr TEXT NOT NULL,
    asr TEXT NOT NULL,
    maghrib TEXT NOT NULL,
    isha TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, date_key)
  )`,
  `CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS semester_breaks (
    id TEXT PRIMARY KEY NOT NULL,
    semester_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    semester_id TEXT NOT NULL,
    title TEXT NOT NULL,
    color TEXT NOT NULL,
    mandatory INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS course_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    course_id TEXT NOT NULL,
    label TEXT NOT NULL,
    room TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    recurrence TEXT NOT NULL,
    dates_json TEXT,
    weekday INTEGER,
    start_date TEXT,
    end_date TEXT,
    enabled INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS study_deadlines (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    note TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    course_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `DROP TABLE IF EXISTS kv_store`,
];

/** Create domain tables if missing, then migrate legacy unscoped rows. */
export async function ensureSchema(): Promise<void> {
  getDb();
  if (!schemaReady) {
    for (const sql of DDL) {
      await cached!.client.execute(sql);
    }
    schemaReady = true;
  }
  // Idempotent — runs again once the data-owner account exists.
  await migrateUserScope(cached!.client);
}
