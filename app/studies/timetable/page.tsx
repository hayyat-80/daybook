import { redirect } from "next/navigation";

/** Old timetable URL — Timetable now lives at /studies. */
export default function TimetableRedirectPage() {
  redirect("/studies");
}
