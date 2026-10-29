"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { CourseForm } from "@/components/timetable/CourseForm";
import { Shell } from "@/components/ui/Shell";
import { useAppStore } from "@/stores/appStore";
import { useTimetableStore } from "@/stores/timetableStore";
import type { TimetableDraft } from "@/types/timetable";

export default function NewCoursePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const addEntry = useTimetableStore((s) => s.addEntry);
  const mergeSemesterBreaks = useTimetableStore((s) => s.mergeSemesterBreaks);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const showToast = useAppStore((s) => s.showToast);

  async function handleSave(draft: TimetableDraft) {
    await addEntry(draft);
    if (activeSemesterId && draft.breaks.length > 0) {
      await mergeSemesterBreaks(activeSemesterId, draft.breaks);
    }
    showToast(t("timetable.save"));
    router.replace("/timetable");
  }

  return (
    <Shell title={t("timetable.addTitle")} backHref="/timetable" backLabel={t("timetable.title")}>
      <CourseForm onSave={handleSave} onCancel={() => router.back()} />
    </Shell>
  );
}
