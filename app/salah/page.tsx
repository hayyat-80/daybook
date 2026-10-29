"use client";

import { useTranslation } from "react-i18next";

import { usePrayerDay, useTickingNow } from "@/hooks/usePrayerDay";
import { countCompleted, dateKeyFromDate } from "@/services/tracking/prayerLog";
import { useAppStore } from "@/stores/appStore";
import type { PrayerStatus } from "@/types/prayer";

import styles from "./page.module.css";

function statusLabel(status: PrayerStatus, t: (k: string) => string) {
  if (status === "prayed") return t("common.prayed");
  if (status === "missed") return t("common.missed");
  return t("common.notTracked");
}

export default function SalahTodayPage() {
  const { t } = useTranslation();
  const now = useTickingNow(15_000);
  const { schedule, nextInfo, remainingLabel, heroTimeLabel } = usePrayerDay(now);
  const dateKey = dateKeyFromDate(now);
  const log = useAppStore((s) => s.prayerLogs[dateKey]);
  const togglePrayerQuick = useAppStore((s) => s.togglePrayerQuick);
  const cyclePrayerStatus = useAppStore((s) => s.cyclePrayerStatus);
  const showToast = useAppStore((s) => s.showToast);

  const completed = log ? countCompleted(log) : 0;

  return (
    <div>
      <section className="hero-card">
        <div className="hero-card__label">
          {nextInfo.isCurrentWindow ? t("today.currentPrayer") : t("today.nextPrayer")}
        </div>
        <div className="hero-card__name">{t(`prayers.${nextInfo.id}`)}</div>
        <div className="hero-card__time">{heroTimeLabel}</div>
        <div className="hero-card__meta">
          {remainingLabel === "now" ? t("common.now") : remainingLabel}
          <span className="hero-card__sep">·</span>
          {t("today.progress", { completed, total: 5 })}
        </div>
      </section>

      <h2 className="section-title rise">{t("today.todaysPrayers")}</h2>
      <div className="card-list">
        {schedule.map((row, index) => {
          const status = log?.prayers[row.id] ?? "not_tracked";
          return (
            <div
              key={row.id}
              className={`list-row rise rise-delay-${Math.min(index + 1, 3)}${row.isHighlighted ? " list-row--highlighted" : ""}`}
            >
              <button
                type="button"
                className={styles.check}
                data-status={status}
                aria-label={statusLabel(status, t)}
                onClick={() => {
                  void togglePrayerQuick(dateKey, row.id).then(() => {
                    if (status !== "prayed") {
                      showToast(t("today.completedToast", { prayer: t(`prayers.${row.id}`) }));
                    }
                  });
                }}
              >
                {status === "prayed" ? "✓" : ""}
              </button>
              <div className="list-row__body">
                <div className="list-row__title">{t(`prayers.${row.id}`)}</div>
                <div className="list-row__meta list-row__meta--tabular">{row.timeLabel}</div>
              </div>
              <button
                type="button"
                className={styles.statusBtn}
                onClick={() => void cyclePrayerStatus(dateKey, row.id)}
              >
                {statusLabel(status, t)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
