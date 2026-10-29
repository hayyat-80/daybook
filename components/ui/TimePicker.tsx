"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { useIsClient } from "@/hooks/useIsClient";
import { popoverStyle, usePopoverPosition } from "@/hooks/usePopoverPosition";

type Props = Readonly<{
  value: string;
  onChange: (time: string) => void;
  /** Minute step size. Defaults to 5 for class schedules. */
  minuteStep?: number;
}>;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

function buildMinutes(step: number, include?: number): string[] {
  const safeStep = Math.max(1, Math.min(30, step));
  const set = new Set<number>();
  for (let m = 0; m < 60; m += safeStep) set.add(m);
  if (include != null && include >= 0 && include < 60) set.add(include);
  return [...set].toSorted((a, b) => a - b).map((m) => String(m).padStart(2, "0"));
}

function parseTime(value: string): { hour: string; minute: string } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return { hour: "09", minute: "15" };
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return {
    hour: String(h).padStart(2, "0"),
    minute: String(m).padStart(2, "0"),
  };
}

function formatTime(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

export function TimePicker({ value, onChange, minuteStep = 5 }: Props) {
  const { t } = useTranslation();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const minutes = buildMinutes(minuteStep, Number(minute));
  const coords = usePopoverPosition(open, triggerRef, panelRef, { minWidth: 260 });

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const nextTime = parseTime(value);
        setHour(nextTime.hour);
        setMinute(nextTime.minute);
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
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function scrollSelected(list: HTMLDivElement | null) {
      const active = list?.querySelector<HTMLElement>(".is-active");
      if (!list || !active) return;
      const top = active.offsetTop - list.clientHeight / 2 + active.offsetHeight / 2;
      list.scrollTop = Math.max(0, top);
    }

    scrollSelected(hourListRef.current);
    scrollSelected(minuteListRef.current);
  }, [open, hour, minute]);

  function commit(nextHour: string, nextMinute: string) {
    setHour(nextHour);
    setMinute(nextMinute);
    onChange(formatTime(nextHour, nextMinute));
  }

  const panel =
    open && mounted
      ? createPortal(
          <section
            ref={panelRef}
            className={`picker-panel time-picker__panel${coords?.placement === "above" ? " is-above" : ""}`}
            id={panelId}
            aria-label={t("timetable.pickTime")}
            style={popoverStyle(coords)}
          >
            <div className="time-picker__columns">
              <div className="time-picker__column">
                <div className="time-picker__column-label">{t("timetable.hours")}</div>
                <div
                  className="time-picker__list"
                  ref={hourListRef}
                  role="listbox"
                  aria-label={t("timetable.hours")}
                >
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      role="option"
                      aria-selected={h === hour}
                      className={`time-picker__option${h === hour ? " is-active" : ""}`}
                      onClick={() => commit(h, minute)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="time-picker__column">
                <div className="time-picker__column-label">{t("timetable.minutes")}</div>
                <div
                  className="time-picker__list"
                  ref={minuteListRef}
                  role="listbox"
                  aria-label={t("timetable.minutes")}
                >
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={m === minute}
                      className={`time-picker__option${m === minute ? " is-active" : ""}`}
                      onClick={() => commit(hour, m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="time-picker__footer">
              <span className="time-picker__preview">{formatTime(hour, minute)}</span>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t("timetable.done")}
              </Button>
            </div>
          </section>,
          document.body,
        )
      : null;

  return (
    <div className="time-picker" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="time-picker__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
      >
        <span className="time-picker__value">{value || "––:––"}</span>
        <span className="time-picker__chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {panel}
    </div>
  );
}
