import { config as loadEnv } from "dotenv";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./schema";

loadEnv({ quiet: true });

type Db = LibSQLDatabase<typeof schema>;

let cached: { db: Db; client: Client } | null = null;
let schemaReady = false;

export function getDb(): Db {
  if (cached) return cached.db;

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
  return cached.db;
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
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
    id INTEGER PRIMARY KEY CHECK (id = 1),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    source TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    active_semester_id TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS prayer_logs (
    date_key TEXT PRIMARY KEY NOT NULL,
    fajr TEXT NOT NULL,
    dhuhr TEXT NOT NULL,
    asr TEXT NOT NULL,
    maghrib TEXT NOT NULL,
    isha TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY NOT NULL,
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
  `DROP TABLE IF EXISTS kv_store`,
];

/** Create domain tables if missing (and drop legacy kv_store). */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  getDb();
  for (const sql of DDL) {
    await cached!.client.execute(sql);
  }
  schemaReady = true;
}
