"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Field, TextInput } from "@/components/ui/Field";
import { EditIcon, IconButton, PlusIcon, TrashIcon } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { createId, formatDisplayDate, parseFlexibleDate } from "@/services/timetable/recurrence";
import { suggestSemesterName } from "@/services/timetable/semester";
import { useAppStore } from "@/stores/appStore";
import { useTimetableStore } from "@/stores/timetableStore";
import type { SemesterBreak, SemesterDraft } from "@/types/timetable";

function emptySemesterDraft(): SemesterDraft {
  return {
    name: suggestSemesterName(),
    startDate: "",
    endDate: "",
    breaks: [],
  };
}

export function SemestersManager({ startInCreate = false }: { startInCreate?: boolean }) {
  const { t } = useTranslation();
  const showToast = useAppStore((s) => s.showToast);
  const semesters = useTimetableStore((s) => s.semesters);
  const entries = useTimetableStore((s) => s.entries);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const setActiveSemester = useTimetableStore((s) => s.setActiveSemester);
  const addSemester = useTimetableStore((s) => s.addSemester);
  const updateSemester = useTimetableStore((s) => s.updateSemester);
  const removeSemester = useTimetableStore((s) => s.removeSemester);

  const [editingId, setEditingId] = useState<string | null>(startInCreate ? "new" : null);
  const [draft, setDraft] = useState<SemesterDraft>(emptySemesterDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    courseCount: number;
  } | null>(null);

  function startCreate() {
    setPendingDelete(null);
    setEditingId("new");
    setDraft(emptySemesterDraft());
    setError(null);
  }

  function startEdit(id: string) {
    const semester = semesters.find((s) => s.id === id);
    if (!semester) return;
    setPendingDelete(null);
    setEditingId(id);
    setDraft({
      name: semester.name,
      startDate: semester.startDate ? formatDisplayDate(semester.startDate) : "",
      endDate: semester.endDate ? formatDisplayDate(semester.endDate) : "",
      breaks: semester.breaks ?? [],
    });
    setError(null);
  }

  function closeEditor() {
    setEditingId(null);
    setError(null);
  }

  async function save() {
    if (!draft.name.trim()) {
      setError(t("timetable.errors.titleRequired"));
      return;
    }
    for (const b of draft.breaks) {
      if (!b.name.trim() || !parseFlexibleDate(b.startDate) || !parseFlexibleDate(b.endDate)) {
        setError(t("timetable.semester.breakInvalid"));
        return;
      }
    }

    const normalized: SemesterDraft = {
      ...draft,
      startDate: draft.startDate.trim() ? (parseFlexibleDate(draft.startDate) ?? "") : "",
      endDate: draft.endDate.trim() ? (parseFlexibleDate(draft.endDate) ?? "") : "",
      breaks: draft.breaks.map((b) => ({
        ...b,
        startDate: parseFlexibleDate(b.startDate)!,
        endDate: parseFlexibleDate(b.endDate)!,
      })),
    };

    setBusy(true);
    try {
      if (editingId === "new") await addSemester(normalized);
      else if (editingId) await updateSemester(editingId, normalized);
      closeEditor();
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(id: string, courseCount: number) {
    if (semesters.length <= 1) {
      showToast(t("timetable.semester.cannotDeleteLast"));
      return;
    }
    closeEditor();
    setPendingDelete({ id, courseCount });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await removeSemester(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="list-toolbar">
        <p className="list-toolbar__copy">{t("timetable.semester.intro")}</p>
        <IconButton label={t("timetable.semester.create")} onClick={startCreate}>
          <PlusIcon />
        </IconButton>
      </div>

      {semesters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{t("timetable.semester.none")}</div>
          <p className="empty-state__body">{t("timetable.semester.intro")}</p>
          <div className="empty-state__actions">
            <Button variant="secondary" onClick={startCreate}>
              {t("timetable.semester.create")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="card-list">
          {semesters.map((semester) => {
            const courseCount = entries.filter((e) => e.semesterId === semester.id).length;
            const active = semester.id === activeSemesterId;
            return (
              <div
                key={semester.id}
                className={`entity-card entity-card--column${active ? " entity-card--active" : ""}`}
              >
                <div className="list-row__main">
                  <div className="entity-card__body">
                    <div className="semester-card__title-row">
                      <div className="list-row__title">{semester.name}</div>
                      {active ? (
                        <span className="status-chip">{t("timetable.semester.active")}</span>
                      ) : null}
                    </div>
                    <div className="list-row__meta meta-gap">
                      {t("timetable.semester.courseCount", { count: courseCount })}
                      {semester.breaks?.length
                        ? ` · ${t("timetable.semester.breakCount", {
                            count: semester.breaks.length,
                          })}`
                        : ""}
                    </div>
                  </div>
                  <div className="list-row__actions">
                    {!active ? (
                      <Button
                        variant="ghost"
                        className="ui-btn--compact"
                        onClick={() => void setActiveSemester(semester.id)}
                      >
                        {t("timetable.semester.switch")}
                      </Button>
                    ) : null}
                    <IconButton
                      label={t("timetable.semester.edit")}
                      onClick={() => {
                        setPendingDelete(null);
                        startEdit(semester.id);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      label={t("timetable.semester.delete")}
                      tone="danger"
                      onClick={() => requestDelete(semester.id, courseCount)}
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

      <ConfirmModal
        open={pendingDelete !== null}
        title={t("timetable.semester.delete")}
        body={
          pendingDelete && pendingDelete.courseCount > 0
            ? t("timetable.semester.deleteBodyWithCourses", {
                count: pendingDelete.courseCount,
              })
            : t("timetable.semester.deleteBody")
        }
        confirmLabel={t("timetable.semester.delete")}
        cancelLabel={t("timetable.cancel")}
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      <Modal
        open={editingId !== null}
        title={
          editingId === "new" ? t("timetable.semester.addTitle") : t("timetable.semester.editTitle")
        }
        onClose={closeEditor}
        wide
      >
        <Field label={t("timetable.semester.namePlaceholder")}>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <div className="form-grid-2">
          <Field label={t("timetable.semester.startOptional")}>
            <TextInput
              value={draft.startDate}
              placeholder="DD.MM.YYYY"
              onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
            />
          </Field>
          <Field label={t("timetable.semester.endOptional")}>
            <TextInput
              value={draft.endDate}
              placeholder="DD.MM.YYYY"
              onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
            />
          </Field>
        </div>

        <div className="row row--between">
          <h3 className="type-headline">{t("timetable.semester.breaks")}</h3>
          <Button
            variant="ghost"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                breaks: [
                  ...d.breaks,
                  { id: createId("brk"), name: "", startDate: "", endDate: "" } as SemesterBreak,
                ],
              }))
            }
          >
            {t("timetable.semester.addBreak")}
          </Button>
        </div>
        <p className="type-caption">{t("timetable.semester.breaksHint")}</p>

        {draft.breaks.map((b, index) => (
          <div key={b.id} className="break-card">
            <Field label={t("timetable.semester.breakNamePlaceholder")}>
              <TextInput
                value={b.name}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    breaks: d.breaks.map((x, i) =>
                      i === index ? { ...x, name: e.target.value } : x,
                    ),
                  }))
                }
              />
            </Field>
            <div className="form-grid-2">
              <Field label={t("timetable.semester.breakStart")}>
                <TextInput
                  value={b.startDate.includes("-") ? formatDisplayDate(b.startDate) : b.startDate}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      breaks: d.breaks.map((x, i) =>
                        i === index ? { ...x, startDate: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </Field>
              <Field label={t("timetable.semester.breakEnd")}>
                <TextInput
                  value={b.endDate.includes("-") ? formatDisplayDate(b.endDate) : b.endDate}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      breaks: d.breaks.map((x, i) =>
                        i === index ? { ...x, endDate: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </Field>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                setDraft((d) => ({ ...d, breaks: d.breaks.filter((_, i) => i !== index) }))
              }
            >
              {t("timetable.semester.removeBreak")}
            </Button>
          </div>
        ))}

        {error ? <p className="text-error">{error}</p> : null}

        <div className="actions-bar actions-bar--form actions-bar--spaced">
          <Button loading={busy} onClick={() => void save()}>
            {busy ? t("common.saving") : t("timetable.save")}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={closeEditor}>
            {t("timetable.cancel")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
