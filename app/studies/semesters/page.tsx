import { redirect } from "next/navigation";

/** Semesters are managed via modal from Studies. */
export default function SemestersRedirectPage() {
  redirect("/studies");
}
