"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { EditIcon, IconButton, PlusIcon, TrashIcon } from "@/components/ui/IconButton";
import { PageLoader } from "@/components/ui/Loader";
import { Modal } from "@/components/ui/Modal";
import { formatDisplayDate } from "@/services/timetable/recurrence";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";
import type { DeadlineDraft, StudyDeadline } from "@/types/deadlines";

import styles from "./page.module.css";

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
  const courseIds = useMemo(
    () => new Set(courseOptions.map((c) => c.id)),
    [courseOptions],
  );
  const scopedItems = useMemo(
    () =>
      items.filter((item) => !item.courseId || courseIds.has(item.courseId)),
    [items, courseIds],
  );

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
    setBusy(true);
    try {
      await remove(pendingDeleteId);
      if (editor?.mode === "edit" && editor.id === pendingDeleteId) closeEditor();
      setPendingDeleteId(null);
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return <PageLoader label={t("common.loading")} />;
  }

  const open = scopedItems.filter((d) => !d.done);
  const done = scopedItems.filter((d) => d.done);

  return (
    <>
      <div className="list-toolbar rise">
        <p className="list-toolbar__copy">{t("deadlines.subtitle")}</p>
        <IconButton label={t("deadlines.add")} onClick={openNew}>
          <PlusIcon />
        </IconButton>
      </div>
      {scopedItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{t("deadlines.emptyTitle")}</div>
          <p className="empty-state__body">{t("deadlines.emptyBody")}</p>
          <div className="empty-state__actions">
            <IconButton label={t("deadlines.add")} onClick={openNew}>
              <PlusIcon />
            </IconButton>
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
                    onToggle={() => void toggleDone(item.id)}
                    onEdit={() => openEdit(item)}
                    onRequestDelete={() => setPendingDeleteId(item.id)}
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
                    dimmed
                    onToggle={() => void toggleDone(item.id)}
                    onEdit={() => openEdit(item)}
                    onRequestDelete={() => setPendingDeleteId(item.id)}
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
        {error ? <p className="text-error text-error--spaced">{error}</p> : null}

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
      </Modal>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title={t("deadlines.delete")}
        body={t("deadlines.deleteConfirmBody")}
        confirmLabel={t("deadlines.delete")}
        cancelLabel={t("deadlines.cancel")}
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}

function DeadlineRow({
  item,
  today,
  courseTitle,
  dimmed = false,
  onToggle,
  onEdit,
  onRequestDelete,
}: Readonly<{
  item: StudyDeadline;
  today: string;
  courseTitle?: string;
  dimmed?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
}>) {
  const { t } = useTranslation();
  const overdue = !item.done && item.dueDate < today;

  return (
    <div
      className={`list-row list-row--stack list-row--column${dimmed ? " list-row--dimmed" : ""}`}
    >
      <div className="list-row__main">
        <label className="ui-check ui-check--flush" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={item.done} onChange={onToggle} />
        </label>
        <button type="button" className={styles.editTrigger} onClick={onEdit}>
          <div className={`list-row__title${item.done ? " list-row__title--done" : ""}`}>
            {item.title}
          </div>
          <div className="list-row__meta">
            <span className={overdue ? "list-row__meta--overdue" : undefined}>
              {formatDisplayDate(item.dueDate)}
              {overdue ? ` · ${t("deadlines.overdue")}` : ""}
            </span>
            {courseTitle ? ` · ${courseTitle}` : ""}
          </div>
          {item.note && !item.done ? <div className="list-row__note">{item.note}</div> : null}
        </button>
        <div className="list-row__actions">
          <IconButton label={t("deadlines.editTitle")} onClick={onEdit}>
            <EditIcon />
          </IconButton>
          <IconButton label={t("deadlines.delete")} tone="danger" onClick={onRequestDelete}>
            <TrashIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
