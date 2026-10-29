"use client";

import { useTranslation } from "react-i18next";

import { useTheme } from "@/design-system/theme";
import { usePrayerDay, useTickingNow } from "@/hooks/usePrayerDay";
import { countCompleted, dateKeyFromDate } from "@/services/tracking/prayerLog";
import { useAppStore } from "@/stores/appStore";
import type { PrayerStatus } from "@/types/prayer";

function statusLabel(status: PrayerStatus, t: (k: string) => string) {
  if (status === "prayed") return t("common.prayed");
  if (status === "missed") return t("common.missed");
  return t("common.notTracked");
}

export default function SalahTodayPage() {
  const { t } = useTranslation();
  const { colors, radius, typography } = useTheme();
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
          <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
          {t("today.progress", { completed, total: 5 })}
        </div>
      </section>

      <h2
        className="rise"
        style={{
          margin: "0 0 12px",
          fontFamily: "var(--font-display)",
          fontSize: "1.15rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {t("today.todaysPrayers")}
      </h2>
      <div className="card-list">
        {schedule.map((row, index) => {
          const status = log?.prayers[row.id] ?? "not_tracked";
          return (
            <div
              key={row.id}
              className={`list-row rise rise-delay-${Math.min(index + 1, 3)}`}
              style={{
                background: row.isHighlighted ? "var(--ui-highlight)" : undefined,
                borderColor: row.isHighlighted
                  ? "color-mix(in srgb, var(--ui-accent) 28%, var(--ui-border))"
                  : undefined,
              }}
            >
              <button
                type="button"
                aria-label={statusLabel(status, t)}
                onClick={() => {
                  void togglePrayerQuick(dateKey, row.id).then(() => {
                    if (status !== "prayed") {
                      showToast(t("today.completedToast", { prayer: t(`prayers.${row.id}`) }));
                    }
                  });
                }}
                style={{
                  width: 42,
                  height: 42,
                  flex: "0 0 auto",
                  borderRadius: radius.full,
                  border: `2px solid ${status === "prayed" ? colors.checkComplete : colors.checkPending}`,
                  background: status === "prayed" ? colors.checkComplete : "transparent",
                  color: "#fff",
                  fontSize: 15,
                  transition: "transform 140ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {status === "prayed" ? "✓" : ""}
              </button>
              <div className="list-row__body">
                <div className="list-row__title">{t(`prayers.${row.id}`)}</div>
                <div className="list-row__meta" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {row.timeLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void cyclePrayerStatus(dateKey, row.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: colors.textSecondary,
                  ...typography.caption,
                  flexShrink: 0,
                  fontWeight: 650,
                }}
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
