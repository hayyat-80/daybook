"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CourseForm } from "@/components/timetable/CourseForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditIcon, IconButton, PlusIcon, TrashIcon } from "@/components/ui/IconButton";
import { PageLoader } from "@/components/ui/Loader";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/stores/appStore";
import { entryToDraft, useTimetableStore } from "@/stores/timetableStore";
import type { TimetableDraft } from "@/types/timetable";

type CourseEditor = { mode: "new" } | { mode: "edit"; id: string };

export default function StudiesCoursesPage() {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<CourseEditor | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const hydrated = useTimetableStore((s) => s.hydrated);
  const semesters = useTimetableStore((s) => s.semesters);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const entries = useTimetableStore((s) => s.entries);
  const addEntry = useTimetableStore((s) => s.addEntry);
  const updateEntry = useTimetableStore((s) => s.updateEntry);
  const removeEntry = useTimetableStore((s) => s.removeEntry);
  const mergeSemesterBreaks = useTimetableStore((s) => s.mergeSemesterBreaks);
  const getEntry = useTimetableStore((s) => s.getEntry);
  const showToast = useAppStore((s) => s.showToast);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId) ?? null;
  const activeEntries = useMemo(
    () => entries.filter((e) => e.semesterId === activeSemesterId),
    [entries, activeSemesterId],
  );
  const editingEntry = editor?.mode === "edit" ? getEntry(editor.id) : null;

  function openNewCourse() {
    setPendingDeleteId(null);
    setEditor({ mode: "new" });
  }

  function openEditCourse(id: string) {
    setPendingDeleteId(null);
    setEditor({ mode: "edit", id });
  }

  function closeEditor() {
    setEditor(null);
  }

  async function handleSave(draft: TimetableDraft) {
    if (editor?.mode === "edit") {
      await updateEntry(editor.id, draft);
      const entry = getEntry(editor.id);
      if (entry?.semesterId && draft.breaks.length > 0) {
        await mergeSemesterBreaks(entry.semesterId, draft.breaks);
      }
    } else {
      await addEntry(draft);
      if (activeSemesterId && draft.breaks.length > 0) {
        await mergeSemesterBreaks(activeSemesterId, draft.breaks);
      }
    }
    showToast(t("timetable.save"));
    closeEditor();
  }

  function handleDeleteFromEditor() {
    if (editor?.mode !== "edit") return;
    setPendingDeleteId(editor.id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleteBusy(true);
    try {
      await removeEntry(pendingDeleteId);
      showToast(t("timetable.delete"));
      if (editor?.mode === "edit" && editor.id === pendingDeleteId) closeEditor();
      setPendingDeleteId(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!hydrated) {
    return <PageLoader label={t("common.loading")} />;
  }

  if (!activeSemester) {
    return (
      <div className="empty-state rise">
        <div className="empty-state__title">{t("timetable.semester.none")}</div>
        <p className="empty-state__body">{t("timetable.semester.intro")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="list-toolbar rise">
        <p className="list-toolbar__copy">{t("timetable.subtitle")}</p>
        <IconButton label={t("timetable.add")} onClick={openNewCourse}>
          <PlusIcon />
        </IconButton>
      </div>

      {activeEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{t("timetable.emptyTitle")}</div>
          <p className="empty-state__body">{t("timetable.emptyBody")}</p>
          <div className="empty-state__actions">
            <IconButton label={t("timetable.add")} onClick={openNewCourse}>
              <PlusIcon />
            </IconButton>
          </div>
        </div>
      ) : (
        <div className="card-list rise">
          {activeEntries.map((entry) => {
            const activeSessions = entry.sessions.filter((s) => s.enabled).length;
            const scheduleLabel =
              entry.sessions.length === 0
                ? t("timetable.noSchedule")
                : t("timetable.sessionCount", {
                    active: activeSessions,
                    count: entry.sessions.length,
                  });
            return (
              <div
                key={entry.id}
                className="list-row list-row--stack list-row--column list-row--accent"
                style={{ ["--row-accent" as string]: entry.color }}
              >
                <div className="list-row__main">
                  <div className="list-row__body">
                    <div className="list-row__title">{entry.title}</div>
                    <div className="list-row__meta">
                      {scheduleLabel}
                      {entry.mandatory ? ` · ${t("timetable.mandatory")}` : ""}
                    </div>
                  </div>
                  <div className="list-row__actions">
                    <IconButton
                      label={t("timetable.editTitle")}
                      onClick={() => openEditCourse(entry.id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      label={t("timetable.delete")}
                      tone="danger"
                      onClick={() => {
                        closeEditor();
                        setPendingDeleteId(entry.id);
                      }}
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={editor !== null && (editor.mode === "new" || editingEntry !== null)}
        title={editor?.mode === "edit" ? t("timetable.editTitle") : t("timetable.addTitle")}
        onClose={closeEditor}
        wide
      >
        {editor ? (
          <CourseForm
            key={editor.mode === "edit" ? editor.id : "new"}
            initial={editingEntry ? entryToDraft(editingEntry) : undefined}
            onSave={handleSave}
            onCancel={closeEditor}
            onDelete={editor.mode === "edit" ? handleDeleteFromEditor : undefined}
          />
        ) : null}
      </Modal>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title={t("timetable.delete")}
        body={t("timetable.deleteConfirmBody")}
        confirmLabel={t("timetable.delete")}
        cancelLabel={t("timetable.cancel")}
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
