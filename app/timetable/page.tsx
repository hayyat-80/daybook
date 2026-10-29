import { redirect } from "next/navigation";

/** Old bookmarks → Studies › Timetable */
export default function TimetableRedirect() {
  redirect("/studies/timetable");
}
