"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Course create now opens as a modal on the timetable page. */
export default function NewCoursePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/studies/timetable");
  }, [router]);
  return null;
}
