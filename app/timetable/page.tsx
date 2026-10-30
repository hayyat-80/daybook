import { redirect } from "next/navigation";

/** Old bookmarks → Studies › Timetable */
export default function LegacyTimetableRedirect() {
  redirect("/studies");
}
