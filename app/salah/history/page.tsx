"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TextInput } from "@/components/ui/Field";
import {
  completionRatio,
  countCompleted,
  dateKeyFromDate,
  emptyDailyLog,
} from "@/services/tracking/prayerLog";
import { useAppStore } from "@/stores/appStore";
import { PRAYER_IDS } from "@/types/prayer";

import styles from "./page.module.css";

export default function SalahHistoryPage() {
  const { t } = useTranslation();
  const [dateKey, setDateKey] = useState(() => dateKeyFromDate(new Date()));
  const prayerLogs = useAppStore((s) => s.prayerLogs);
  const cyclePrayerStatus = useAppStore((s) => s.cyclePrayerStatus);

  const log = useMemo(() => prayerLogs[dateKey] ?? emptyDailyLog(dateKey), [prayerLogs, dateKey]);
  const percent = Math.round(completionRatio(log) * 100);

  return (
    <div className="stack rise">
      <div>
        <label className="type-label">{t("history.selectDate")}</label>
        <TextInput type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
      </div>

      <p className={styles.summary}>
        {t("history.dailyCompletion", { percent })} · {countCompleted(log)}/5
      </p>

      <div className="card-list">
        {PRAYER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`list-row ${styles.rowBtn}`}
            onClick={() => void cyclePrayerStatus(dateKey, id)}
          >
            <span className={`list-row__title ${styles.rowTitle}`}>{t(`prayers.${id}`)}</span>
            <span className="list-row__side list-row__side--muted">
              {log.prayers[id] === "prayed"
                ? t("common.prayed")
                : log.prayers[id] === "missed"
                  ? t("common.missed")
                  : t("common.notTracked")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
