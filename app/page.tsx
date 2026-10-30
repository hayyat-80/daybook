"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Shell } from "@/components/ui/Shell";
import { usePrayerDay, useTickingNow } from "@/hooks/usePrayerDay";
import { computeStats } from "@/services/insights/stats";
import { formatLocationLabel } from "@/services/location/locationService";
import { formatDisplayDate, occurrencesForDate } from "@/services/timetable/recurrence";
import { countCompleted, dateKeyFromDate } from "@/services/tracking/prayerLog";
import { useAppStore } from "@/stores/appStore";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";

import styles from "./page.module.css";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const now = useTickingNow(30_000);
  const dateKey = dateKeyFromDate(now);
  const { nextInfo, remainingLabel, heroTimeLabel } = usePrayerDay(now);

  const location = useAppStore((s) => s.location);
  const prayerLogs = useAppStore((s) => s.prayerLogs);
  const log = prayerLogs[dateKey];
  const completed = log ? countCompleted(log) : 0;
  const stats = useMemo(() => computeStats(prayerLogs, now), [prayerLogs, now]);

  const semesters = useTimetableStore((s) => s.semesters);
  const activeSemesterId = useTimetableStore((s) => s.activeSemesterId);
  const entries = useTimetableStore((s) => s.entries);
  const activeSemester = semesters.find((s) => s.id === activeSemesterId) ?? null;
  const activeEntries = useMemo(
    () => entries.filter((e) => e.semesterId === activeSemesterId),
    [entries, activeSemesterId],
  );
  const classesToday = useMemo(
    () => occurrencesForDate(activeEntries, dateKey, activeSemester?.breaks),
    [activeEntries, dateKey, activeSemester?.breaks],
  );

  const deadlines = useDeadlinesStore((s) => s.items);
  const openDeadlines = useMemo(
    () => deadlines.filter((d) => !d.done).toSorted((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [deadlines],
  );
  const overdue = openDeadlines.filter((d) => d.dueDate < dateKey);
  const upcoming = openDeadlines.filter((d) => d.dueDate >= dateKey).slice(0, 5);
  const dueSoon = openDeadlines.filter((d) => d.dueDate >= dateKey && d.dueDate <= addDays(dateKey, 7));

  const locale = i18n.language === "ar" ? "ar" : i18n.language === "de" ? "de-DE" : "en-US";
  const dateLabel = now.toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const remainingText =
    remainingLabel === "now" ? t("common.now") : remainingLabel;

  return (
    <Shell brand>
      <div className={styles.dash}>
        <header className={styles.top}>
          <div>
            <p className={styles.kicker}>
              <span className={styles.dot} />
              {formatLocationLabel(location)}
            </p>
            <h1 className={styles.greeting}>{t("common.assalamuAlaikum")}</h1>
            <p className={styles.dateLine}>{dateLabel}</p>
          </div>
        </header>

        <section className={styles.stats} aria-label={t("dashboard.overview")}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t("dashboard.stats.salah")}</span>
            <strong className={styles.statValue}>
              {completed}
              <span className={styles.statSuffix}>/5</span>
            </strong>
            <span className={styles.statHint}>
              {t("insights.currentStreak")}: {t("insights.days", { count: stats.currentStreak })}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t("dashboard.stats.classes")}</span>
            <strong className={styles.statValue}>{classesToday.length}</strong>
            <span className={styles.statHint}>{t("dashboard.stats.classesHint")}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t("dashboard.stats.deadlines")}</span>
            <strong className={styles.statValue}>{dueSoon.length}</strong>
            <span className={styles.statHint}>
              {overdue.length > 0
                ? t("dashboard.stats.overdue", { count: overdue.length })
                : t("dashboard.stats.deadlinesHint")}
            </span>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={`${styles.panel} ${styles.panelHero}`}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>{t("dashboard.salah.title")}</h2>
              <Link href="/salah" className={styles.panelLink}>
                {t("dashboard.open")}
              </Link>
            </div>
            <div className={styles.hero}>
              <div className={styles.heroLabel}>
                {nextInfo.isCurrentWindow ? t("today.currentPrayer") : t("today.nextPrayer")}
              </div>
              <div className={styles.heroName}>{t(`prayers.${nextInfo.id}`)}</div>
              <div className={styles.heroTime}>{heroTimeLabel}</div>
              <div className={styles.heroMeta}>
                {remainingText}
                <span className={styles.sep}>·</span>
                {t("today.progress", { completed, total: 5 })}
              </div>
            </div>
            <div className={styles.meter} aria-hidden>
              <div
                className={styles.meterFill}
                style={{ ["--meter" as string]: `${(completed / 5) * 100}%` }}
              />
            </div>
          </section>

          <section className={`${styles.panel} ${styles.panelClasses}`}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>{t("dashboard.classes.title")}</h2>
              <Link href="/studies" className={styles.panelLink}>
                {t("dashboard.open")}
              </Link>
            </div>
            {classesToday.length === 0 ? (
              <p className={styles.empty}>{t("dashboard.classes.empty")}</p>
            ) : (
              <ul className={styles.list}>
                {classesToday.map((occ) => (
                  <li key={`${occ.entryId}-${occ.sessionId}-${occ.startTime}`} className={styles.row}>
                    <span
                      className={styles.swatch}
                      style={{ ["--swatch" as string]: occ.color }}
                      aria-hidden
                    />
                    <div className={styles.rowBody}>
                      <div className={styles.rowTitle}>{occ.title}</div>
                      <div className={styles.rowMeta}>
                        {occ.sessionLabel}
                        {occ.room ? ` · ${occ.room}` : ""}
                      </div>
                    </div>
                    <div className={styles.rowTime}>
                      {occ.startTime}
                      <span className={styles.rowTimeEnd}>–{occ.endTime}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${styles.panel} ${styles.panelWide}`}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>{t("dashboard.deadlines.title")}</h2>
              <Link href="/studies/deadlines" className={styles.panelLink}>
                {t("dashboard.open")}
              </Link>
            </div>
            {upcoming.length === 0 && overdue.length === 0 ? (
              <p className={styles.empty}>{t("dashboard.deadlines.empty")}</p>
            ) : (
              <ul className={styles.list}>
                {[...overdue.slice(0, 3), ...upcoming].slice(0, 6).map((item) => {
                  const isOverdue = item.dueDate < dateKey;
                  const isToday = item.dueDate === dateKey;
                  return (
                    <li key={item.id} className={styles.row}>
                      <div className={styles.rowBody}>
                        <div className={styles.rowTitle}>{item.title}</div>
                        {item.note ? <div className={styles.rowMeta}>{item.note}</div> : null}
                      </div>
                      <span
                        className={`${styles.badge}${isOverdue ? ` ${styles.badgeDanger}` : ""}${isToday ? ` ${styles.badgeToday}` : ""}`}
                      >
                        {isOverdue
                          ? t("deadlines.overdue")
                          : isToday
                            ? t("common.today")
                            : formatDisplayDate(item.dueDate)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Shell>
  );
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
