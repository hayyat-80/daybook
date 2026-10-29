"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CourseForm } from "@/components/timetable/CourseForm";
import { Button } from "@/components/ui/Button";
import { Chevron } from "@/components/ui/Chevron";
import { PageLoader } from "@/components/ui/Loader";
import { Modal } from "@/components/ui/Modal";
import { Shell } from "@/components/ui/Shell";
import {
  breaksOnDate,
  formatDisplayDate,
  formatMonthLabel,
  monthDateKeys,
  occurrencesForDate,
  shiftMonth,
} from "@/services/timetable/recurrence";
import { useAppStore } from "@/stores/appStore";
import { entryToDraft, useTimetableStore } from "@/stores/timetableStore";
import type { ClassOccurrence, TimetableDraft } from "@/types/timetable";

type Mode = "calendar" | "courses";
type CourseEditor = { mode: "new" } | { mode: "edit"; id: string };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TimetablePage() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<Mode>("calendar");
  const [today] = useState(todayKey);
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(() => `${today.slice(0, 8)}01`);
  const [editor, setEditor] = useState<CourseEditor | null>(null);
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
  const breaks = activeSemester?.breaks;
  const editingEntry = editor?.mode === "edit" ? getEntry(editor.id) : null;

  const monthKeys = monthDateKeys(monthAnchor);
  const locale = i18n.language === "ar" ? "ar" : i18n.language === "de" ? "de-DE" : "en-US";
  const monthLabel = formatMonthLabel(monthAnchor, locale);
  const currentMonth = monthAnchor.slice(0, 7);

  const occurrences = occurrencesForDate(activeEntries, selectedDate, breaks);
  const dayBreaks = breaksOnDate(breaks, selectedDate);

  const monthDays = (() => {
    const map = new Map<
      string,
      { classes: ClassOccurrence[]; isBreak: boolean; breakNames: string[] }
    >();
    for (const key of monthKeys) {
      const dayOcc = occurrencesForDate(activeEntries, key, breaks);
      const dayBreakList = breaksOnDate(breaks, key);
      map.set(key, {
        classes: dayOcc,
        isBreak: dayBreakList.length > 0,
        breakNames: dayBreakList.map((b) => b.name),
      });
    }
    return map;
  })();

  function selectDay(dateKey: string) {
    setSelectedDate(dateKey);
    if (!dateKey.startsWith(currentMonth)) {
      setMonthAnchor(`${dateKey.slice(0, 8)}01`);
    }
  }

  function openNewCourse() {
    setEditor({ mode: "new" });
  }

  function openEditCourse(id: string) {
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

  async function handleDelete() {
    if (editor?.mode !== "edit") return;
    await removeEntry(editor.id);
    showToast(t("timetable.delete"));
    closeEditor();
  }

  if (!hydrated) {
    return (
      <Shell title={t("timetable.title")} backHref="/studies" backLabel={t("studies.title")}>
        <PageLoader label={t("common.loading")} />
      </Shell>
    );
  }

  return (
    <Shell
      title={t("timetable.title")}
      subtitle={t("timetable.subtitle")}
      backHref="/studies"
      backLabel={t("studies.title")}
      action={
        <Button variant="secondary" onClick={openNewCourse}>
          {t("timetable.add")}
        </Button>
      }
    >
      <div className="row row--between rise row--mb-md">
        <div className="min-width-0">
          <div className="type-eyebrow">{t("timetable.semester.label")}</div>
          <div className="type-display-sm">
            {activeSemester?.name ?? t("timetable.semester.none")}
          </div>
        </div>
        <Link href="/studies/timetable/semesters" className="ui-btn ui-btn--ghost ui-btn--compact">
          {t("timetable.semester.manage")}
        </Link>
      </div>

      <div className="segmented rise" role="tablist">
        {(["calendar", "courses"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`segmented__item${mode === m ? " is-active" : ""}`}
            onClick={() => setMode(m)}
          >
            {t(`timetable.modes.${m}`)}
          </button>
        ))}
      </div>

      {mode === "calendar" ? (
        <>
          <div className="month-nav">
            <Button
              variant="ghost"
              aria-label={t("timetable.previousMonth")}
              onClick={() => setMonthAnchor(shiftMonth(monthAnchor, -1))}
            >
              <Chevron direction="left" />
            </Button>
            <h2 className="month-nav__label">{monthLabel}</h2>
            <Button
              variant="ghost"
              aria-label={t("timetable.nextMonth")}
              onClick={() => setMonthAnchor(shiftMonth(monthAnchor, 1))}
            >
              <Chevron direction="right" />
            </Button>
          </div>

          <div className="month-grid" role="grid" aria-label={monthLabel}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={`h-${i}`} className="month-grid__head">
                {t(`timetable.weekdaysShort.${i}`)}
              </div>
            ))}
            {monthKeys.map((key) => {
              const meta = monthDays.get(key) ?? {
                classes: [],
                isBreak: false,
                breakNames: [],
              };
              const inMonth = key.startsWith(currentMonth);
              const selected = key === selectedDate;
              const isToday = key === today;
              const visible = meta.classes.slice(0, 3);
              const overflow = meta.classes.length - visible.length;
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    "month-grid__cell",
                    inMonth ? "" : "month-grid__cell--muted",
                    selected ? "month-grid__cell--selected" : "",
                    isToday ? "month-grid__cell--today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectDay(key)}
                  aria-pressed={selected}
                  aria-label={
                    meta.classes.length > 0
                      ? `${key}: ${t("timetable.classCount", { count: meta.classes.length })}`
                      : key
                  }
                >
                  <span className="month-grid__daynum">{Number(key.slice(8))}</span>
                  {meta.isBreak ? (
                    <span className="month-grid__break">
                      {meta.breakNames[0] ?? t("timetable.semester.breaks")}
                    </span>
                  ) : null}
                  {visible.length > 0 ? (
                    <span className="month-grid__classes">
                      {visible.map((occ) => (
                        <span
                          key={`${key}-${occ.sessionId}-${occ.startTime}`}
                          className="month-grid__class"
                          style={{ ["--class-color" as string]: occ.color }}
                        >
                          <span className="month-grid__class-time">{occ.startTime}</span>
                          <span className="month-grid__class-title">{occ.title}</span>
                        </span>
                      ))}
                      {overflow > 0 ? <span className="month-grid__more">+{overflow}</span> : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <DayAgenda
            selectedDate={selectedDate}
            dayBreaks={dayBreaks.map((b) => b.name)}
            occurrences={occurrences}
            onOpenCourse={openEditCourse}
          />
        </>
      ) : null}

      {mode === "courses" ? (
        activeEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">{t("timetable.emptyTitle")}</div>
            <p className="empty-state__body">{t("timetable.emptyBody")}</p>
            <div className="empty-state__actions">
              <Button variant="secondary" onClick={openNewCourse}>
                {t("timetable.add")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="card-list">
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
                <button
                  key={entry.id}
                  type="button"
                  className="list-row list-row--accent"
                  style={{ ["--row-accent" as string]: entry.color }}
                  onClick={() => openEditCourse(entry.id)}
                >
                  <div className="list-row__body">
                    <div className="list-row__title">{entry.title}</div>
                    <div className="list-row__meta">
                      {scheduleLabel}
                      {entry.mandatory ? ` · ${t("timetable.mandatory")}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : null}

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
            onDelete={editor.mode === "edit" ? handleDelete : undefined}
          />
        ) : null}
      </Modal>
    </Shell>
  );
}

function DayAgenda({
  selectedDate,
  dayBreaks,
  occurrences,
  onOpenCourse,
}: Readonly<{
  selectedDate: string;
  dayBreaks: string[];
  occurrences: ClassOccurrence[];
  onOpenCourse: (id: string) => void;
}>) {
  const { t } = useTranslation();

  return (
    <section className="day-agenda" aria-live="polite">
      <h2 className="day-agenda__title">{formatDisplayDate(selectedDate)}</h2>

      {dayBreaks.length > 0 ? (
        <div className="panel panel--highlight">{dayBreaks.join(" · ")}</div>
      ) : null}

      {occurrences.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{t("timetable.emptyDayTitle")}</div>
          <p className="empty-state__body">{t("timetable.emptyDayBody")}</p>
        </div>
      ) : (
        <div className="card-list">
          {occurrences.map((occ) => {
            const recurrenceLabel = t(`timetable.recurrence.${occ.recurrence}`);
            return (
              <button
                key={`${occ.entryId}-${occ.sessionId}-${occ.startTime}`}
                type="button"
                className="list-row list-row--stack list-row--accent"
                style={{ ["--row-accent" as string]: occ.color }}
                onClick={() => onOpenCourse(occ.entryId)}
              >
                <div className="list-row__body">
                  <div className="list-row__title">{occ.title}</div>
                  <div className="list-row__meta">
                    {occ.sessionLabel}
                    {occ.mandatory ? ` · ${t("timetable.mandatory")}` : ""}
                    {" · "}
                    {recurrenceLabel}
                  </div>
                  {occ.note ? <div className="list-row__note">{occ.note}</div> : null}
                </div>
                <div className="list-row__side">
                  {occ.startTime}–{occ.endTime}
                  <div className="list-row__room">{occ.room || t("timetable.noRoom")}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
