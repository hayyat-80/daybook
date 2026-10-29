"use client";

import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";

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
  /** Gap between trigger and panel */
  gap?: number;
  /** Viewport edge padding */
  padding?: number;
};

const DEFAULTS: Required<Options> = {
  minWidth: 280,
  gap: 6,
  padding: 10,
};

export function usePopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  options: Options = {},
): PopoverCoords | null {
  const { minWidth, gap, padding } = { ...DEFAULTS, ...options };
  const [coords, setCoords] = useState<PopoverCoords | null>(null);

  const update = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(rect.width, minWidth), vw - padding * 2);

    let left = rect.left + (rect.width - width) / 2;
    if (left + width > vw - padding) left = vw - padding - width;
    if (left < padding) left = padding;

    const spaceBelow = vh - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    const panelHeight = panelRef.current?.offsetHeight ?? 320;
    const fitsBelow = spaceBelow >= Math.min(panelHeight, 240) || spaceBelow >= spaceAbove;

    if (fitsBelow) {
      setCoords({
        placement: "below",
        top: rect.bottom + gap,
        left,
        width,
        maxHeight: Math.max(160, spaceBelow),
      });
      return;
    }

    setCoords({
      placement: "above",
      bottom: vh - rect.top + gap,
      left,
      width,
      maxHeight: Math.max(160, spaceAbove),
    });
  }, [gap, minWidth, padding, panelRef, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;

    update();
    const frame = window.requestAnimationFrame(update);

    const panel = panelRef.current;
    const observer =
      panel && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => update())
        : null;
    if (panel && observer) observer.observe(panel);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, panelRef, update]);

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
