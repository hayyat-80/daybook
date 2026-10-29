"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Shell } from "@/components/ui/Shell";
import { useTheme } from "@/design-system/theme";
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

export default function SemestersPage() {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const showToast = useAppStore((s) => s.showToast);
  const semesters = useTimetableStore((s) => s.semesters);
  const entries = useTimetableStore((s) => s.entries);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const setActiveSemester = useTimetableStore((s) => s.setActiveSemester);
  const addSemester = useTimetableStore((s) => s.addSemester);
  const updateSemester = useTimetableStore((s) => s.updateSemester);
  const removeSemester = useTimetableStore((s) => s.removeSemester);

  const [editingId, setEditingId] = useState<string | null>(null);
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
    <Shell
      title={t("timetable.semester.manageTitle")}
      subtitle={t("timetable.semester.intro")}
      backHref="/studies/timetable"
      backLabel={t("timetable.title")}
      action={
        <Button variant="secondary" onClick={startCreate}>
          {t("timetable.semester.create")}
        </Button>
      }
    >
      <div className="card-list">
        {semesters.map((semester) => {
          const courseCount = entries.filter((e) => e.semesterId === semester.id).length;
          const active = semester.id === activeSemesterId;
          const deleting = pendingDelete?.id === semester.id;
          return (
            <div
              key={semester.id}
              className={`entity-card${active ? " entity-card--active" : ""}`}
              style={{ flexDirection: "column", alignItems: "stretch" }}
            >
              <div className="row row--between" style={{ gap: 12, width: "100%" }}>
                <div className="entity-card__body">
                  <div className="list-row__title">
                    {semester.name}
                    {active ? ` · ${t("timetable.semester.active")}` : ""}
                  </div>
                  <div className="list-row__meta" style={{ marginTop: 4 }}>
                    {t("timetable.semester.courseCount", { count: courseCount })}
                    {semester.breaks?.length
                      ? ` · ${t("timetable.semester.breakCount", { count: semester.breaks.length })}`
                      : ""}
                  </div>
                </div>
                {!deleting ? (
                  <div className="entity-card__actions">
                    {!active ? (
                      <Button variant="ghost" onClick={() => void setActiveSemester(semester.id)}>
                        {t("timetable.semester.switch")}
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setPendingDelete(null);
                        startEdit(semester.id);
                      }}
                    >
                      {t("timetable.semester.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => requestDelete(semester.id, courseCount)}
                    >
                      {t("timetable.semester.delete")}
                    </Button>
                  </div>
                ) : null}
              </div>
              {deleting ? (
                <div className="confirm-banner" style={{ marginTop: 12 }}>
                  <p className="confirm-banner__text">
                    {courseCount > 0
                      ? t("timetable.semester.deleteBodyWithCourses", { count: courseCount })
                      : t("timetable.semester.deleteBody")}
                  </p>
                  <div className="actions-bar">
                    <Button variant="danger" loading={busy} onClick={() => void confirmDelete()}>
                      {t("timetable.semester.delete")}
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => setPendingDelete(null)}>
                      {t("timetable.cancel")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

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
          <h3 style={{ margin: 0, ...typography.headline }}>{t("timetable.semester.breaks")}</h3>
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
        <p style={{ color: colors.textSecondary, ...typography.caption }}>
          {t("timetable.semester.breaksHint")}
        </p>

        {draft.breaks.map((b, index) => (
          <div
            key={b.id}
            style={{
              marginTop: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.md,
              background: colors.backgroundSecondary,
            }}
          >
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

        {error ? <p style={{ color: "#BE123C", ...typography.footnote }}>{error}</p> : null}

        <div className="actions-bar actions-bar--form" style={{ marginTop: spacing.md }}>
          <Button loading={busy} onClick={() => void save()}>
            {busy ? t("common.saving") : t("timetable.save")}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={closeEditor}>
            {t("timetable.cancel")}
          </Button>
        </div>
      </Modal>
    </Shell>
  );
}
