import { redirect } from "next/navigation";

/** Old semesters URL — managed via modal from Studies. */
export default function SemestersRedirectPage() {
  redirect("/studies");
}
