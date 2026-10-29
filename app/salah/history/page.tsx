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
        <label
          style={{
            display: "block",
            marginBottom: 8,
            color: "var(--ui-muted)",
            fontSize: "0.8rem",
            fontWeight: 650,
          }}
        >
          {t("history.selectDate")}
        </label>
        <TextInput type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        {t("history.dailyCompletion", { percent })} · {countCompleted(log)}/5
      </p>

      <div className="card-list">
        {PRAYER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="list-row"
            onClick={() => void cyclePrayerStatus(dateKey, id)}
            style={{ width: "100%", color: "var(--ui-text)", textAlign: "start" }}
          >
            <span className="list-row__title" style={{ flex: 1 }}>
              {t(`prayers.${id}`)}
            </span>
            <span className="list-row__side" style={{ color: "var(--ui-muted)" }}>
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
