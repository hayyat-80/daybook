"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Chevron } from "@/components/ui/Chevron";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconButton, TrashIcon } from "@/components/ui/IconButton";
import { MultiDatePicker } from "@/components/ui/MultiDatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { parseWeeklyPlan } from "@/services/timetable/planImport";
import {
  formatDisplayDate,
  parseFlexibleDate,
  weekdayFromDateKey,
} from "@/services/timetable/recurrence";
import { emptyDraft, emptySessionDraft } from "@/stores/timetableStore";
import type { RecurrenceKind, SubjectColor, TimetableDraft, Weekday } from "@/types/timetable";
import { SUBJECT_COLORS } from "@/types/timetable";

import styles from "./CourseForm.module.css";

const TIME_RE = /^\d{2}:\d{2}$/;

type Props = Readonly<{
  initial?: TimetableDraft;
  onSave: (draft: TimetableDraft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}>;

export function CourseForm({ initial, onSave, onCancel, onDelete }: Props) {
  const { t } = useTranslation();
  const [todayKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [draft, setDraft] = useState<TimetableDraft>(() => initial ?? emptyDraft(todayKey));
  const [planText, setPlanText] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [openSessions, setOpenSessions] = useState<Record<string, boolean>>(() => {
    const sessions = (initial ?? emptyDraft(todayKey)).sessions;
    return Object.fromEntries(sessions.map((s, i) => [s.id, i === 0]));
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function updateSession(index: number, patch: Partial<TimetableDraft["sessions"][number]>) {
    setDraft((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function toggleSession(id: string) {
    setOpenSessions((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function applyPlan() {
    const parsed = parseWeeklyPlan(planText);
    if (parsed.sessions.length === 0 && parsed.breaks.length === 0) {
      setError(t("timetable.errors.planEmpty"));
      return;
    }

    const sessions = parsed.sessions.map((group) => ({
      ...emptySessionDraft(todayKey, group.label),
      room: group.room,
      recurrence: "dates" as const,
      dates: group.dates,
      startDate: formatDisplayDate(group.dates[0] ?? todayKey),
      endDate: "",
    }));

    setDraft((prev) => ({
      ...prev,
      sessions: sessions.length > 0 ? sessions : prev.sessions,
      breaks: [...prev.breaks, ...parsed.breaks],
    }));
    if (sessions.length > 0) {
      setOpenSessions(Object.fromEntries(sessions.map((s) => [s.id, true])));
    }
    setPlanOpen(false);
    setError(null);
  }

  async function submit() {
    if (!draft.title.trim()) {
      setError(t("timetable.errors.titleRequired"));
      return;
    }
    for (const session of draft.sessions) {
      if (!session.label.trim()) {
        setError(t("timetable.errors.sessionLabelRequired"));
        setOpenSessions((prev) => ({ ...prev, [session.id]: true }));
        return;
      }
      if (!TIME_RE.test(session.startTime) || !TIME_RE.test(session.endTime)) {
        setError(t("timetable.errors.timeFormat"));
        setOpenSessions((prev) => ({ ...prev, [session.id]: true }));
        return;
      }
      if (session.recurrence === "dates" && session.dates.length === 0) {
        setError(t("timetable.errors.datesRequired"));
        setOpenSessions((prev) => ({ ...prev, [session.id]: true }));
        return;
      }
      if (session.recurrence !== "dates") {
        const start = parseFlexibleDate(session.startDate);
        if (!start) {
          setError(t("timetable.errors.dateFormat"));
          setOpenSessions((prev) => ({ ...prev, [session.id]: true }));
          return;
        }
        if (session.endDate.trim() && !parseFlexibleDate(session.endDate)) {
          setError(t("timetable.errors.dateFormat"));
          setOpenSessions((prev) => ({ ...prev, [session.id]: true }));
          return;
        }
      }
    }

    setBusy(true);
    setError(null);
    try {
      await onSave(draft);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <Field label={t("timetable.fields.title")}>
        <TextInput
          value={draft.title}
          placeholder={t("timetable.placeholders.title")}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </Field>

      <div>
        <div className={`type-footnote ${styles.colorLabel}`}>{t("timetable.fields.color")}</div>
        <div className="color-swatches">
          {SUBJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => setDraft((d) => ({ ...d, color: color as SubjectColor }))}
              className={`${styles.swatch}${draft.color === color ? ` ${styles.swatchSelected}` : ""}`}
              style={{ ["--swatch-color" as string]: color }}
            />
          ))}
        </div>
      </div>

      <label className="toggle-row">
        <span className="toggle-row__copy">
          <strong className="toggle-row__title">{t("timetable.fields.mandatory")}</strong>
          <span className="toggle-row__hint">{t("timetable.fields.mandatoryHint")}</span>
        </span>
        <span className="toggle-row__control">
          <input
            type="checkbox"
            className="toggle-row__input"
            checked={draft.mandatory}
            onChange={(e) => setDraft((d) => ({ ...d, mandatory: e.target.checked }))}
          />
          <span className="toggle-row__track" aria-hidden>
            <span className="toggle-row__thumb" />
          </span>
        </span>
      </label>

      <Field label={t("timetable.fields.note")}>
        <TextArea
          value={draft.note}
          placeholder={t("timetable.placeholders.note")}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
        />
      </Field>

      <section className="panel collapse-panel">
        <button
          type="button"
          className="collapse-panel__header"
          aria-expanded={planOpen}
          onClick={() => setPlanOpen((prev) => !prev)}
        >
          <span className="collapse-panel__heading">{t("timetable.pastePlan")}</span>
          <span className="collapse-panel__chevron" aria-hidden>
            <Chevron open={planOpen} />
          </span>
        </button>
        {planOpen ? (
          <div className="collapse-panel__body">
            <p className={`type-caption ${styles.planHint}`}>{t("timetable.pastePlanHint")}</p>
            <TextArea
              value={planText}
              placeholder={t("timetable.placeholders.plan")}
              onChange={(e) => setPlanText(e.target.value)}
            />
            <Button variant="secondary" block className={styles.applyPlan} onClick={applyPlan}>
              {t("timetable.applyPlan")}
            </Button>
          </div>
        ) : null}
      </section>

      <div className="row row--between">
        <h3 className="type-headline">{t("timetable.fields.sessions")}</h3>
        <Button
          variant="ghost"
          onClick={() => {
            const session = emptySessionDraft(
              todayKey,
              draft.sessions.length === 0
                ? t("timetable.sessionDefaults.lecture")
                : t("timetable.sessionDefaults.exercise"),
            );
            setDraft((d) => ({ ...d, sessions: [...d.sessions, session] }));
            setOpenSessions((prev) => ({ ...prev, [session.id]: true }));
          }}
        >
          {t("timetable.addSession")}
        </Button>
      </div>
      <p className="type-caption">{t("timetable.fields.sessionsHint")}</p>

      {draft.sessions.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <div className="empty-state__title--sm">{t("timetable.noScheduleTitle")}</div>
          <p className="empty-state__body">{t("timetable.noScheduleBody")}</p>
        </div>
      ) : null}

      {draft.sessions.map((session, index) => {
        const isOpen = openSessions[session.id] ?? false;
        const summary = [session.label, `${session.startTime}–${session.endTime}`, session.room]
          .filter(Boolean)
          .join(" · ");
        return (
          <div key={session.id} className={`panel collapse-panel ${styles.sessionPanel}`}>
            <div className={`row ${styles.sessionHeaderRow}`}>
              <button
                type="button"
                className={`collapse-panel__header ${styles.sessionHeader}`}
                aria-expanded={isOpen}
                onClick={() => toggleSession(session.id)}
              >
                <span className="collapse-panel__heading">
                  {t("timetable.session")} {index + 1}
                  {!isOpen && summary ? (
                    <span className="collapse-panel__meta">{summary}</span>
                  ) : null}
                </span>
                <span className="collapse-panel__chevron" aria-hidden>
                  <Chevron open={isOpen} />
                </span>
              </button>
              <div className="collapse-panel__actions">
                <IconButton
                  label={t("timetable.removeSession")}
                  tone="danger"
                  onClick={() => {
                    setDraft((d) => ({
                      ...d,
                      sessions: d.sessions.filter((_, i) => i !== index),
                    }));
                    setOpenSessions((prev) => {
                      const next = { ...prev };
                      delete next[session.id];
                      return next;
                    });
                  }}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </div>

            {isOpen ? (
              <div className="collapse-panel__body">
                <Field label={t("timetable.fields.sessionLabel")}>
                  <TextInput
                    value={session.label}
                    placeholder={t("timetable.placeholders.sessionLabel")}
                    onChange={(e) => updateSession(index, { label: e.target.value })}
                  />
                </Field>
                <Field label={t("timetable.fields.room")}>
                  <TextInput
                    value={session.room}
                    placeholder={t("timetable.placeholders.room")}
                    onChange={(e) => updateSession(index, { room: e.target.value })}
                  />
                </Field>
                <div className="form-grid-2">
                  <Field label={t("timetable.fields.startTime")}>
                    <TimePicker
                      value={session.startTime}
                      onChange={(startTime) => {
                        updateSession(index, { startTime });
                        setError(null);
                      }}
                    />
                  </Field>
                  <Field label={t("timetable.fields.endTime")}>
                    <TimePicker
                      value={session.endTime}
                      onChange={(endTime) => {
                        updateSession(index, { endTime });
                        setError(null);
                      }}
                    />
                  </Field>
                </div>
                <Field label={t("timetable.fields.recurrence")}>
                  <Select
                    value={session.recurrence}
                    onChange={(e) =>
                      updateSession(index, { recurrence: e.target.value as RecurrenceKind })
                    }
                  >
                    <option value="dates">{t("timetable.recurrence.dates")}</option>
                    <option value="weekly">{t("timetable.recurrence.weekly")}</option>
                    <option value="biweekly">{t("timetable.recurrence.biweekly")}</option>
                  </Select>
                </Field>

                {session.recurrence === "dates" ? (
                  <Field label={t("timetable.fields.dates")}>
                    <MultiDatePicker
                      value={session.dates}
                      todayKey={todayKey}
                      onChange={(dates) => {
                        updateSession(index, { dates });
                        setError(null);
                      }}
                    />
                  </Field>
                ) : (
                  <>
                    <Field label={t("timetable.fields.startDate")}>
                      <DatePicker
                        value={session.startDate}
                        todayKey={todayKey}
                        onChange={(startDate) => {
                          const key = parseFlexibleDate(startDate);
                          updateSession(index, {
                            startDate,
                            weekday: key ? weekdayFromDateKey(key) : null,
                          });
                          setError(null);
                        }}
                      />
                    </Field>
                    <Field label={t("timetable.fields.weekday")}>
                      <Select
                        value={session.weekday ?? ""}
                        onChange={(e) =>
                          updateSession(index, {
                            weekday:
                              e.target.value === ""
                                ? null
                                : (Number(e.target.value) as Weekday),
                          })
                        }
                      >
                        <option value="">{t("timetable.placeholders.weekday")}</option>
                        {Array.from({ length: 7 }, (_, i) => (
                          <option key={i} value={i}>
                            {t(`timetable.weekdaysShort.${i}`)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={t("timetable.fields.endDateOptional")}>
                      <DatePicker
                        value={session.endDate}
                        todayKey={todayKey}
                        allowClear
                        placeholder={t("timetable.placeholders.endDate")}
                        onChange={(endDate) => {
                          updateSession(index, { endDate });
                          setError(null);
                        }}
                      />
                    </Field>
                  </>
                )}

                <label className="toggle-row">
                  <span className="toggle-row__copy">
                    <strong className="toggle-row__title">
                      {t("timetable.fields.sessionEnabled")}
                    </strong>
                  </span>
                  <span className="toggle-row__control">
                    <input
                      type="checkbox"
                      className="toggle-row__input"
                      checked={session.enabled}
                      onChange={(e) => updateSession(index, { enabled: e.target.checked })}
                    />
                    <span className="toggle-row__track" aria-hidden>
                      <span className="toggle-row__thumb" />
                    </span>
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        );
      })}

      {error ? <p className="text-error">{error}</p> : null}

      {confirmDelete && onDelete ? (
        <div className="confirm-banner">
          <p className="confirm-banner__text">{t("timetable.deleteConfirmBody")}</p>
          <div className="actions-bar">
            <Button
              variant="danger"
              loading={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    await onDelete();
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              {t("timetable.delete")}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>
              {t("timetable.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="actions-bar actions-bar--form">
          <Button loading={busy} onClick={() => void submit()}>
            {busy ? t("common.saving") : t("timetable.save")}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            {t("timetable.cancel")}
          </Button>
          {onDelete ? (
            <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
              {t("timetable.delete")}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
