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
  isValidDateKey,
  monthDateKeys,
  parseFlexibleDate,
  shiftMonth,
} from "@/services/timetable/recurrence";

type Props = Readonly<{
  value: string;
  onChange: (displayDate: string) => void;
  todayKey?: string;
  placeholder?: string;
  allowClear?: boolean;
}>;

function defaultTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isValidDateKey(trimmed)) return trimmed;
  return parseFlexibleDate(trimmed);
}

export function DatePicker({
  value,
  onChange,
  todayKey,
  placeholder,
  allowClear = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const [today] = useState(() => todayKey ?? defaultTodayKey());
  const selectedKey = toDateKey(value);
  const coords = usePopoverPosition(open, triggerRef, panelRef, { minWidth: 300 });

  const [monthAnchor, setMonthAnchor] = useState(() => {
    const seed = selectedKey ?? todayKey ?? defaultTodayKey();
    return `${seed.slice(0, 8)}01`;
  });

  let locale = "en-US";
  if (i18n.language === "ar") locale = "ar";
  else if (i18n.language === "de") locale = "de-DE";

  const monthKeys = monthDateKeys(monthAnchor);
  const currentMonth = monthAnchor.slice(0, 7);
  const monthLabel = formatMonthLabel(monthAnchor, locale);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next && selectedKey) {
        setMonthAnchor(`${selectedKey.slice(0, 8)}01`);
      }
      return next;
    });
  }

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

  function pickDate(dateKey: string) {
    onChange(formatDisplayDate(dateKey));
    setOpen(false);
  }

  function clearDate() {
    onChange("");
    setOpen(false);
  }

  const triggerLabel = selectedKey
    ? formatDisplayDate(selectedKey)
    : (placeholder ?? t("timetable.pickDate"));

  const panel =
    open && mounted
      ? createPortal(
          <section
            ref={panelRef}
            className={`picker-panel date-picker__panel${coords?.placement === "above" ? " is-above" : ""}`}
            id={panelId}
            aria-label={t("timetable.pickDate")}
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
                const isSelected = key === selectedKey;
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
                    onClick={() => pickDate(key)}
                  >
                    <span className="month-grid__daynum">{Number(key.slice(8))}</span>
                  </button>
                );
              })}
            </div>

            {allowClear ? (
              <div className="date-picker__footer">
                <Button type="button" variant="ghost" onClick={clearDate}>
                  {t("timetable.clearDate")}
                </Button>
              </div>
            ) : null}
          </section>,
          document.body,
        )
      : null;

  return (
    <div className="date-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`date-picker__trigger${selectedKey ? "" : " is-empty"}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
      >
        <span>{triggerLabel}</span>
        <span className="date-picker__chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {panel}
    </div>
  );
}
