import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** App accounts — roles: admin | user (extensible). */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Per-user preferences. */
export const settings = sqliteTable("settings", {
  userId: text("user_id").primaryKey(),
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

/** Per-user location for prayer times. */
export const location = sqliteTable("location", {
  userId: text("user_id").primaryKey(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  timezone: text("timezone").notNull(),
  source: text("source").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Per-user app flags. */
export const appState = sqliteTable("app_state", {
  userId: text("user_id").primaryKey(),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" }).notNull().default(false),
  activeSemesterId: text("active_semester_id"),
});

/** One row per user + calendar day of prayer tracking. */
export const prayerLogs = sqliteTable(
  "prayer_logs",
  {
    userId: text("user_id").notNull(),
    dateKey: text("date_key").notNull(),
    fajr: text("fajr").notNull(),
    dhuhr: text("dhuhr").notNull(),
    asr: text("asr").notNull(),
    maghrib: text("maghrib").notNull(),
    isha: text("isha").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.dateKey] }),
  }),
);

export const semesters = sqliteTable("semesters", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
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
  userId: text("user_id").notNull(),
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

/** Assignments / exams / other study deadlines. */
export const studyDeadlines = sqliteTable("study_deadlines", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  dueDate: text("due_date").notNull(),
  note: text("note"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  courseId: text("course_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
