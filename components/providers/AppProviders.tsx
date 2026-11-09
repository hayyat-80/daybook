"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { I18nextProvider } from "react-i18next";

import { ThemeProvider } from "@/design-system/theme";
import i18n, { applyLanguage, type AppLanguage } from "@/i18n";
import { Toast } from "@/components/ui/Toast";
import { useAppStore } from "@/stores/appStore";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrateApp = useAppStore((s) => s.hydrate);
  const hydrateTimetable = useTimetableStore((s) => s.hydrate);
  const hydrateDeadlines = useDeadlinesStore((s) => s.hydrate);
  const language = useAppStore((s) => s.settings.language);
  const hydrated = useAppStore((s) => s.hydrated);
  const isAuthScreen = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (isAuthScreen) return;
    void hydrateApp();
    void hydrateTimetable();
    void hydrateDeadlines();
  }, [isAuthScreen, hydrateApp, hydrateTimetable, hydrateDeadlines]);

  useEffect(() => {
    if (!hydrated) return;
    applyLanguage(language as AppLanguage);
  }, [hydrated, language]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {children}
        {!isAuthScreen ? <Toast /> : null}
      </ThemeProvider>
    </I18nextProvider>
  );
}
