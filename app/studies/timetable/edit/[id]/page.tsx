"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Course edit now opens as a modal on the timetable page. */
export default function EditCoursePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/studies/timetable");
  }, [router]);
  return null;
}
