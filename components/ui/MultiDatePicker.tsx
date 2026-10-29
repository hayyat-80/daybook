"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { useIsClient } from "@/hooks/useIsClient";
import { popoverStyle, usePopoverPosition } from "@/hooks/usePopoverPosition";
import {
  formatDisplayDate,
  formatMonthLabel,
  monthDateKeys,
  shiftMonth,
} from "@/services/timetable/recurrence";

type Props = Readonly<{
  value: string[];
  onChange: (dates: string[]) => void;
  todayKey?: string;
}>;

function defaultTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MultiDatePicker({ value, onChange, todayKey }: Props) {
  const { t, i18n } = useTranslation();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const [today] = useState(() => todayKey ?? defaultTodayKey());
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const seed = value[0] ?? todayKey ?? defaultTodayKey();
    return `${seed.slice(0, 8)}01`;
  });
  const coords = usePopoverPosition(open, triggerRef, panelRef, { minWidth: 300 });

  let locale = "en-US";
  if (i18n.language === "ar") locale = "ar";
  else if (i18n.language === "de") locale = "de-DE";
  const monthKeys = monthDateKeys(monthAnchor);
  const currentMonth = monthAnchor.slice(0, 7);
  const monthLabel = formatMonthLabel(monthAnchor, locale);
  const selected = new Set(value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleDate(dateKey: string) {
    if (selected.has(dateKey)) {
      onChange(value.filter((d) => d !== dateKey));
      return;
    }
    onChange([...value, dateKey].toSorted((a, b) => a.localeCompare(b)));
  }

  function removeDate(dateKey: string) {
    onChange(value.filter((d) => d !== dateKey));
  }

  const triggerLabel =
    value.length === 0
      ? t("timetable.pickDates")
      : t("timetable.datesSelected", { count: value.length });

  const panel =
    open && mounted
      ? createPortal(
          <section
            ref={panelRef}
            className={`picker-panel multi-date__panel${coords?.placement === "above" ? " is-above" : ""}`}
            id={panelId}
            aria-label={triggerLabel}
            style={popoverStyle(coords)}
          >
            <div className="month-nav">
              <Button
                variant="ghost"
                aria-label={t("timetable.previousMonth")}
                onClick={() => setMonthAnchor(shiftMonth(monthAnchor, -1))}
              >
                ←
              </Button>
              <h3 className="month-nav__label">{monthLabel}</h3>
              <Button
                variant="ghost"
                aria-label={t("timetable.nextMonth")}
                onClick={() => setMonthAnchor(shiftMonth(monthAnchor, 1))}
              >
                →
              </Button>
            </div>

            <div className="month-grid month-grid--picker" role="grid" aria-label={monthLabel}>
              {Array.from({ length: 7 }, (_, i) => (
                <div key={`h-${i}`} className="month-grid__head">
                  {t(`timetable.weekdaysShort.${i}`)}
                </div>
              ))}
              {monthKeys.map((key) => {
                const inMonth = key.startsWith(currentMonth);
                const isSelected = selected.has(key);
                const isToday = key === today;
                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      "month-grid__cell",
                      "month-grid__cell--picker",
                      inMonth ? "" : "month-grid__cell--muted",
                      isSelected ? "month-grid__cell--picked" : "",
                      isToday ? "month-grid__cell--today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={isSelected}
                    onClick={() => toggleDate(key)}
                  >
                    <span className="month-grid__daynum">{Number(key.slice(8))}</span>
                  </button>
                );
              })}
            </div>

            <p className="multi-date__hint">{t("timetable.pickDatesHint")}</p>
          </section>,
          document.body,
        )
      : null;

  return (
    <div className="multi-date" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="multi-date__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{triggerLabel}</span>
        <span className="multi-date__chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {panel}

      {value.length > 0 ? (
        <div className="chip-row">
          {value.map((date) => (
            <button
              key={date}
              type="button"
              className="multi-date__chip"
              onClick={() => removeDate(date)}
              aria-label={`${t("timetable.removeDate")}: ${formatDisplayDate(date)}`}
            >
              {formatDisplayDate(date)} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
