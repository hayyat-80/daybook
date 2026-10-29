"use client";

import { useTranslation } from "react-i18next";

import { computeStats } from "@/services/insights/stats";
import { useAppStore } from "@/stores/appStore";

export default function SalahInsightsPage() {
  const { t } = useTranslation();
  const prayerLogs = useAppStore((s) => s.prayerLogs);
  const stats = computeStats(prayerLogs);

  const cards = [
    {
      label: t("insights.thisMonth", { percent: stats.monthCompletionPercent }),
      value: `${stats.monthCompletionPercent}%`,
      hint: t("insights.consistency"),
    },
    {
      label: t("insights.currentStreak"),
      value: t("insights.days", { count: stats.currentStreak }),
      hint: `${t("insights.bestStreak")}: ${stats.bestStreak}`,
    },
    {
      label: t("insights.mostConsistent"),
      value: stats.mostConsistentPrayer
        ? `${t(`prayers.${stats.mostConsistentPrayer.id}`)} (${stats.mostConsistentPrayer.percent}%)`
        : "—",
      hint: t("insights.monthlyOverview"),
    },
  ];

  return (
    <div className="insights-grid">
      {cards.map((card, index) => (
        <div key={card.label} className={`panel rise rise-delay-${Math.min(index + 1, 3)}`}>
          <div style={{ color: "var(--ui-muted)", fontSize: "0.78rem", fontWeight: 650 }}>
            {card.label}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 4vw, 1.7rem)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              overflowWrap: "anywhere",
            }}
          >
            {card.value}
          </div>
          <div style={{ marginTop: 6, color: "var(--ui-faint)", fontSize: "0.78rem" }}>
            {card.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
