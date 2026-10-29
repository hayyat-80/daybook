"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Loader";
import { Modal } from "@/components/ui/Modal";
import { Shell } from "@/components/ui/Shell";
import { formatDisplayDate } from "@/services/timetable/recurrence";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";
import type { DeadlineDraft, StudyDeadline } from "@/types/deadlines";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyDraft(today: string): DeadlineDraft {
  return {
    title: "",
    dueDate: formatDisplayDate(today),
    note: "",
    courseId: "",
  };
}

function toDraft(item: StudyDeadline): DeadlineDraft {
  return {
    title: item.title,
    dueDate: formatDisplayDate(item.dueDate),
    note: item.note ?? "",
    courseId: item.courseId ?? "",
  };
}

type Editor = { mode: "new" } | { mode: "edit"; id: string };

export default function DeadlinesPage() {
  const { t } = useTranslation();
  const [today] = useState(todayKey);
  const hydrated = useDeadlinesStore((s) => s.hydrated);
  const items = useDeadlinesStore((s) => s.items);
  const add = useDeadlinesStore((s) => s.add);
  const update = useDeadlinesStore((s) => s.update);
  const toggleDone = useDeadlinesStore((s) => s.toggleDone);
  const remove = useDeadlinesStore((s) => s.remove);
  const courses = useTimetableStore((s) => s.entries);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft(today));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const courseOptions = courses.filter((c) => c.semesterId === activeSemesterId);

  function openNew() {
    setPendingDeleteId(null);
    setEditor({ mode: "new" });
    setDraft(emptyDraft(today));
    setError(null);
  }

  function openEdit(item: StudyDeadline) {
    setPendingDeleteId(null);
    setEditor({ mode: "edit", id: item.id });
    setDraft(toDraft(item));
    setError(null);
  }

  function closeEditor() {
    setEditor(null);
    setError(null);
  }

  async function submit() {
    if (!draft.title.trim()) {
      setError(t("deadlines.errors.titleRequired"));
      return;
    }
    if (!draft.dueDate.trim()) {
      setError(t("deadlines.errors.dateRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editor?.mode === "edit") await update(editor.id, draft);
      else await add(draft);
      closeEditor();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    await remove(pendingDeleteId);
    setPendingDeleteId(null);
    if (editor?.mode === "edit" && editor.id === pendingDeleteId) closeEditor();
  }

  if (!hydrated) {
    return (
      <Shell title={t("deadlines.title")} backHref="/studies" backLabel={t("studies.title")}>
        <PageLoader label={t("common.loading")} />
      </Shell>
    );
  }

  const open = items.filter((d) => !d.done);
  const done = items.filter((d) => d.done);

  return (
    <Shell
      title={t("deadlines.title")}
      subtitle={t("deadlines.subtitle")}
      backHref="/studies"
      backLabel={t("studies.title")}
      action={
        <Button variant="secondary" onClick={openNew}>
          {t("deadlines.add")}
        </Button>
      }
    >
      {items.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600 }}>
            {t("deadlines.emptyTitle")}
          </div>
          <p style={{ color: "var(--ui-muted)", marginBottom: 0 }}>{t("deadlines.emptyBody")}</p>
          <div style={{ marginTop: 16 }}>
            <Button variant="secondary" onClick={openNew}>
              {t("deadlines.add")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="stack">
          {open.length > 0 ? (
            <section>
              <h2 className="day-agenda__title">{t("deadlines.open")}</h2>
              <div className="card-list">
                {open.map((item) => (
                  <DeadlineRow
                    key={item.id}
                    item={item}
                    today={today}
                    courseTitle={courses.find((c) => c.id === item.courseId)?.title}
                    deleting={pendingDeleteId === item.id}
                    onToggle={() => void toggleDone(item.id)}
                    onEdit={() => openEdit(item)}
                    onRequestDelete={() => {
                      closeEditor();
                      setPendingDeleteId(item.id);
                    }}
                    onConfirmDelete={() => void confirmDelete()}
                    onCancelDelete={() => setPendingDeleteId(null)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {done.length > 0 ? (
            <section>
              <h2 className="day-agenda__title">{t("deadlines.done")}</h2>
              <div className="card-list">
                {done.map((item) => (
                  <DeadlineRow
                    key={item.id}
                    item={item}
                    today={today}
                    courseTitle={courses.find((c) => c.id === item.courseId)?.title}
                    deleting={pendingDeleteId === item.id}
                    dimmed
                    onToggle={() => void toggleDone(item.id)}
                    onEdit={() => openEdit(item)}
                    onRequestDelete={() => {
                      closeEditor();
                      setPendingDeleteId(item.id);
                    }}
                    onConfirmDelete={() => void confirmDelete()}
                    onCancelDelete={() => setPendingDeleteId(null)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <Modal
        open={editor !== null}
        title={editor?.mode === "edit" ? t("deadlines.editTitle") : t("deadlines.addTitle")}
        onClose={closeEditor}
      >
        <Field label={t("deadlines.fields.title")}>
          <TextInput
            value={draft.title}
            placeholder={t("deadlines.placeholders.title")}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </Field>
        <Field label={t("deadlines.fields.dueDate")}>
          <DatePicker
            value={draft.dueDate}
            todayKey={today}
            onChange={(dueDate) => setDraft((d) => ({ ...d, dueDate }))}
          />
        </Field>
        {courseOptions.length > 0 ? (
          <Field label={t("deadlines.fields.courseOptional")}>
            <Select
              value={draft.courseId}
              onChange={(e) => setDraft((d) => ({ ...d, courseId: e.target.value }))}
            >
              <option value="">{t("deadlines.noCourse")}</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label={t("deadlines.fields.note")}>
          <TextArea
            value={draft.note}
            placeholder={t("deadlines.placeholders.note")}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />
        </Field>
        {error ? <p style={{ margin: "0 0 12px", color: "#BE123C" }}>{error}</p> : null}

        {editor?.mode === "edit" && pendingDeleteId === editor.id ? (
          <div className="confirm-banner">
            <p className="confirm-banner__text">{t("deadlines.deleteConfirmBody")}</p>
            <div className="actions-bar">
              <Button variant="danger" loading={busy} onClick={() => void confirmDelete()}>
                {t("deadlines.delete")}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setPendingDeleteId(null)}>
                {t("deadlines.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="actions-bar actions-bar--form">
            <Button loading={busy} onClick={() => void submit()}>
              {busy ? t("common.saving") : t("deadlines.save")}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={closeEditor}>
              {t("deadlines.cancel")}
            </Button>
            {editor?.mode === "edit" ? (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setPendingDeleteId(editor.id)}
              >
                {t("deadlines.delete")}
              </Button>
            ) : null}
          </div>
        )}
      </Modal>
    </Shell>
  );
}

function DeadlineRow({
  item,
  today,
  courseTitle,
  deleting,
  dimmed = false,
  onToggle,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: Readonly<{
  item: StudyDeadline;
  today: string;
  courseTitle?: string;
  deleting: boolean;
  dimmed?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}>) {
  const { t } = useTranslation();
  const overdue = !item.done && item.dueDate < today;

  return (
    <div
      className="list-row list-row--stack"
      style={{
        opacity: dimmed ? 0.72 : undefined,
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <div className="row row--between" style={{ gap: 12, width: "100%" }}>
        <label className="ui-check" style={{ margin: 0 }} onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={item.done} onChange={onToggle} />
        </label>
        <button
          type="button"
          onClick={onEdit}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            background: "transparent",
            padding: 0,
            textAlign: "start",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          <div
            className="list-row__title"
            style={item.done ? { textDecoration: "line-through" } : undefined}
          >
            {item.title}
          </div>
          <div className="list-row__meta">
            <span style={overdue ? { color: "#BE123C", fontWeight: 650 } : undefined}>
              {formatDisplayDate(item.dueDate)}
              {overdue ? ` · ${t("deadlines.overdue")}` : ""}
            </span>
            {courseTitle ? ` · ${courseTitle}` : ""}
          </div>
          {item.note && !item.done ? <div className="list-row__note">{item.note}</div> : null}
        </button>
        {!deleting ? (
          <Button variant="ghost" onClick={onRequestDelete}>
            {t("deadlines.delete")}
          </Button>
        ) : null}
      </div>
      {deleting ? (
        <div className="confirm-banner" style={{ marginTop: 10 }}>
          <p className="confirm-banner__text">{t("deadlines.deleteConfirmBody")}</p>
          <div className="actions-bar">
            <Button variant="danger" onClick={onConfirmDelete}>
              {t("deadlines.delete")}
            </Button>
            <Button variant="secondary" onClick={onCancelDelete}>
              {t("deadlines.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
