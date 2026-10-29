"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Shell } from "@/components/ui/Shell";
import {
  breaksOnDate,
  formatDisplayDate,
  formatMonthLabel,
  monthDateKeys,
  occurrencesForDate,
  shiftMonth,
} from "@/services/timetable/recurrence";
import { useTimetableStore } from "@/stores/timetableStore";
import type { ClassOccurrence } from "@/types/timetable";

type Mode = "calendar" | "courses";

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
  const hydrated = useTimetableStore((s) => s.hydrated);
  const semesters = useTimetableStore((s) => s.semesters);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const entries = useTimetableStore((s) => s.entries);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId) ?? null;
  const activeEntries = useMemo(
    () => entries.filter((e) => e.semesterId === activeSemesterId),
    [entries, activeSemesterId],
  );
  const breaks = activeSemester?.breaks;

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

  if (!hydrated) {
    return (
      <Shell title={t("timetable.title")} backHref="/">
        <p style={{ color: "var(--ui-muted)" }}>Loading…</p>
      </Shell>
    );
  }

  return (
    <Shell
      title={t("timetable.title")}
      subtitle={t("timetable.subtitle")}
      backHref="/"
      action={
        <Link href="/timetable/edit" className="ui-btn ui-btn--primary">
          {t("timetable.add")}
        </Link>
      }
    >
      <div className="row row--between rise" style={{ marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: "var(--ui-muted)",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {t("timetable.semester.label")}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              overflowWrap: "anywhere",
            }}
          >
            {activeSemester?.name ?? t("timetable.semester.none")}
          </div>
        </div>
        <Link
          href="/timetable/semesters"
          className="ui-btn ui-btn--ghost"
          style={{ minHeight: 40 }}
        >
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
            style={
              mode === m
                ? undefined
                : { color: "var(--ui-muted)", border: "none", background: "transparent" }
            }
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
              ←
            </Button>
            <h2 className="month-nav__label">{monthLabel}</h2>
            <Button
              variant="ghost"
              aria-label={t("timetable.nextMonth")}
              onClick={() => setMonthAnchor(shiftMonth(monthAnchor, 1))}
            >
              →
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
                          style={{ borderLeftColor: occ.color }}
                        >
                          <span className="month-grid__class-time">{occ.startTime}</span>
                          <span className="month-grid__class-title">{occ.title}</span>
                        </span>
                      ))}
                      {overflow > 0 ? (
                        <span className="month-grid__more">+{overflow}</span>
                      ) : null}
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
          />
        </>
      ) : null}

      {mode === "courses" ? (
        activeEntries.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600 }}>
              {t("timetable.emptyTitle")}
            </div>
            <p style={{ color: "var(--ui-muted)", marginBottom: 0 }}>{t("timetable.emptyBody")}</p>
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
                <Link
                  key={entry.id}
                  href={`/timetable/edit/${entry.id}`}
                  className="list-row"
                  style={{ borderLeft: `3px solid ${entry.color}` }}
                >
                  <div className="list-row__body">
                    <div className="list-row__title">{entry.title}</div>
                    <div className="list-row__meta">
                      {scheduleLabel}
                      {entry.mandatory ? ` · ${t("timetable.mandatory")}` : ""}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : null}
    </Shell>
  );
}

function DayAgenda({
  selectedDate,
  dayBreaks,
  occurrences,
}: Readonly<{
  selectedDate: string;
  dayBreaks: string[];
  occurrences: ClassOccurrence[];
}>) {
  const { t } = useTranslation();

  return (
    <section className="day-agenda" aria-live="polite">
      <h2 className="day-agenda__title">{formatDisplayDate(selectedDate)}</h2>

      {dayBreaks.length > 0 ? (
        <div className="panel" style={{ marginBottom: 12, background: "var(--ui-highlight)" }}>
          {dayBreaks.join(" · ")}
        </div>
      ) : null}

      {occurrences.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600 }}>
            {t("timetable.emptyDayTitle")}
          </div>
          <p style={{ color: "var(--ui-muted)", marginBottom: 0 }}>{t("timetable.emptyDayBody")}</p>
        </div>
      ) : (
        <div className="card-list">
          {occurrences.map((occ) => {
            const recurrenceLabel = t(`timetable.recurrence.${occ.recurrence}`);
            return (
              <Link
                key={`${occ.entryId}-${occ.sessionId}-${occ.startTime}`}
                href={`/timetable/edit/${occ.entryId}`}
                className="list-row list-row--stack"
                style={{ borderLeft: `3px solid ${occ.color}` }}
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
                  <div style={{ color: "var(--ui-faint)", fontSize: "0.75rem", fontWeight: 500 }}>
                    {occ.room || t("timetable.noRoom")}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
