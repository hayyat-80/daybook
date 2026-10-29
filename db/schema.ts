import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Singleton app preferences (always id = 1). */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),
  calculationMethod: text("calculation_method").notNull(),
  madhab: text("madhab").notNull(),
  highLatitudeRule: text("high_latitude_rule").notNull(),
  adjustmentsJson: text("adjustments_json").notNull(),
  appearance: text("appearance").notNull(),
  language: text("language").notNull(),
  hapticFeedback: integer("haptic_feedback", { mode: "boolean" }).notNull(),
  soundEnabled: integer("sound_enabled", { mode: "boolean" }).notNull(),
  firstDayOfWeek: integer("first_day_of_week").notNull(),
  autoLocationUpdates: integer("auto_location_updates", { mode: "boolean" }).notNull(),
  notificationsJson: text("notifications_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Current location used for prayer times (always id = 1). */
export const location = sqliteTable("location", {
  id: integer("id").primaryKey().default(1),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  timezone: text("timezone").notNull(),
  source: text("source").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** App-level flags (always id = 1). */
export const appState = sqliteTable("app_state", {
  id: integer("id").primaryKey().default(1),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" }).notNull().default(false),
  activeSemesterId: text("active_semester_id"),
});

/** One row per calendar day of prayer tracking. */
export const prayerLogs = sqliteTable("prayer_logs", {
  dateKey: text("date_key").primaryKey(),
  fajr: text("fajr").notNull(),
  dhuhr: text("dhuhr").notNull(),
  asr: text("asr").notNull(),
  maghrib: text("maghrib").notNull(),
  isha: text("isha").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const semesters = sqliteTable("semesters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const semesterBreaks = sqliteTable("semester_breaks", {
  id: text("id").primaryKey(),
  semesterId: text("semester_id").notNull(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  semesterId: text("semester_id").notNull(),
  title: text("title").notNull(),
  color: text("color").notNull(),
  mandatory: integer("mandatory", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const courseSessions = sqliteTable("course_sessions", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull(),
  label: text("label").notNull(),
  room: text("room").notNull().default(""),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  recurrence: text("recurrence").notNull(),
  datesJson: text("dates_json"),
  weekday: integer("weekday"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});
