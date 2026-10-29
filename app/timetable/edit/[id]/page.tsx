"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { CourseForm } from "@/components/timetable/CourseForm";
import { Shell } from "@/components/ui/Shell";
import { useAppStore } from "@/stores/appStore";
import { entryToDraft, useTimetableStore } from "@/stores/timetableStore";
import type { TimetableDraft } from "@/types/timetable";

export default function EditCoursePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const entry = useTimetableStore((s) => s.getEntry(id));
  const updateEntry = useTimetableStore((s) => s.updateEntry);
  const removeEntry = useTimetableStore((s) => s.removeEntry);
  const mergeSemesterBreaks = useTimetableStore((s) => s.mergeSemesterBreaks);
  const showToast = useAppStore((s) => s.showToast);

  if (!entry) {
    return (
      <Shell
        title={t("timetable.editTitle")}
        backHref="/timetable"
        backLabel={t("timetable.title")}
      >
        <p>Course not found.</p>
      </Shell>
    );
  }

  async function handleSave(draft: TimetableDraft) {
    await updateEntry(id, draft);
    if (entry?.semesterId && draft.breaks.length > 0) {
      await mergeSemesterBreaks(entry.semesterId, draft.breaks);
    }
    showToast(t("timetable.save"));
    router.replace("/timetable");
  }

  async function handleDelete() {
    await removeEntry(id);
    router.replace("/timetable");
  }

  return (
    <Shell title={t("timetable.editTitle")} backHref="/timetable" backLabel={t("timetable.title")}>
      <CourseForm
        initial={entryToDraft(entry)}
        onSave={handleSave}
        onCancel={() => router.back()}
        onDelete={handleDelete}
      />
    </Shell>
  );
}
