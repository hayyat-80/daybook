"use client";

import { useTranslation } from "react-i18next";

import { computeStats } from "@/services/insights/stats";
import { useAppStore } from "@/stores/appStore";

import styles from "./page.module.css";

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
          <div className={styles.label}>{card.label}</div>
          <div className={styles.value}>{card.value}</div>
          <div className={styles.hint}>{card.hint}</div>
        </div>
      ))}
    </div>
  );
}
