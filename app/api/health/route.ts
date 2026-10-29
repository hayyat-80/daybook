import { ensureSchema } from "@/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    return Response.json({
      ok: true,
      provider: "turso",
      tables: [
        "settings",
        "location",
        "app_state",
        "prayer_logs",
        "semesters",
        "semester_breaks",
        "courses",
        "course_sessions",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
