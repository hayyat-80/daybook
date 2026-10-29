"use client";

import { type CSSProperties, type RefObject, useCallback, useLayoutEffect, useState } from "react";

export type PopoverCoords = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
  placement: "above" | "below";
};

type Options = {
  /** Preferred minimum panel width in px */
  minWidth?: number;
  /** Cap width so wide form fields don't stretch the panel */
  maxWidth?: number;
  /** Gap between trigger and panel */
  gap?: number;
  /** Viewport edge padding */
  padding?: number;
  /** Horizontal alignment to the trigger */
  align?: "start" | "center" | "end";
};

const DEFAULTS: Required<Options> = {
  minWidth: 280,
  maxWidth: 340,
  gap: 6,
  padding: 10,
  align: "start",
};

/** Comfortable height before we prefer flipping above the field. */
const MIN_COMFORTABLE = 260;

export function usePopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  options: Options = {},
): PopoverCoords | null {
  const { minWidth, maxWidth, gap, padding, align } = { ...DEFAULTS, ...options };
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const update = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(minWidth, Math.min(rect.width, maxWidth)), vw - padding * 2);

    let left = rect.left;
    if (align === "center") left = rect.left + (rect.width - width) / 2;
    if (align === "end") left = rect.right - width;
    if (left + width > vw - padding) left = vw - padding - width;
    if (left < padding) left = padding;

    const spaceBelow = vh - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const panelHeight = panelRef.current?.offsetHeight || MIN_COMFORTABLE;
    const needed = Math.min(panelHeight, MIN_COMFORTABLE);

    // Prefer below only when it actually fits; otherwise open above the field.
    const placeBelow = spaceBelow >= needed;

    if (placeBelow) {
      setCoords({
        placement: "below",
        top: rect.bottom + gap,
        left,
        width,
        maxHeight: Math.min(380, Math.max(160, spaceBelow)),
      });
      return;
    }

    setCoords({
      placement: "above",
      bottom: vh - rect.top + gap,
      left,
      width,
      maxHeight: Math.min(380, Math.max(160, spaceAbove)),
    });
  }, [align, gap, maxWidth, minWidth, padding, panelRef, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;

    triggerRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    update();
    const frame = window.requestAnimationFrame(update);

    const panel = panelRef.current;
    const observer =
      panel && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => update()) : null;
    if (panel && observer) observer.observe(panel);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, panelRef, triggerRef, update]);

  return open ? coords : null;
}

export function popoverStyle(coords: PopoverCoords | null): CSSProperties {
  if (!coords) return { visibility: "hidden" };
  return {
    position: "fixed",
    left: coords.left,
    width: coords.width,
    maxHeight: coords.maxHeight,
    top: coords.top,
    bottom: coords.bottom,
    visibility: "visible",
  };
}
