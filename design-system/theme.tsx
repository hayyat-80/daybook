"use client";

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { darkColors, lightColors, type ThemeColors } from "./colors";
import { radius, spacing } from "./spacing";
import { typography } from "./typography";
import { useAppStore } from "@/stores/appStore";

export type AppearanceMode = "system" | "light" | "dark";

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
};

const ThemeContext = createContext<AppTheme | null>(null);

function subscribeSystemDark(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSystemDarkSnapshot() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemDarkServerSnapshot() {
  return false;
}

function useSystemDark() {
  return useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot,
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useSystemDark();
  const appearance = useAppStore((s) => s.settings.appearance);

  const isDark = appearance === "dark" || (appearance === "system" && systemDark);

  const value = useMemo<AppTheme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      isDark,
    }),
    [isDark],
  );

  useEffect(() => {
    const root = document.documentElement;
    const c = value.colors;
    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";
    root.style.setProperty("--ui-bg", c.background);
    root.style.setProperty("--ui-surface", c.surface);
    root.style.setProperty("--ui-panel", c.backgroundSecondary);
    root.style.setProperty("--ui-hero", c.heroBackground);
    root.style.setProperty("--ui-border", c.border);
    root.style.setProperty("--ui-text", c.text);
    root.style.setProperty("--ui-fg", c.text);
    root.style.setProperty("--ui-muted", c.textSecondary);
    root.style.setProperty("--ui-faint", c.textTertiary);
    root.style.setProperty("--ui-accent", c.accent);
    root.style.setProperty("--ui-accent-muted", c.accentMuted);
    root.style.setProperty("--ui-highlight", c.highlight);
    root.style.setProperty("--ui-glow", c.glow);
    root.style.setProperty("--ui-check", c.checkComplete);
    root.style.setProperty("--ui-check-pending", c.checkPending);
  }, [isDark, value.colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return theme;
}
