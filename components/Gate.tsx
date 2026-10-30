"use client";

import { useTranslation } from "react-i18next";

import { AppNav } from "@/components/nav/AppNav";
import { PageLoader } from "@/components/ui/Loader";
import { useAppStore } from "@/stores/appStore";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";

export function Gate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const hydrated = useAppStore((s) => s.hydrated);
  const timetableHydrated = useTimetableStore((s) => s.hydrated);
  const deadlinesHydrated = useDeadlinesStore((s) => s.hydrated);
  const ready = hydrated && timetableHydrated && deadlinesHydrated;

  if (!ready) {
    return <PageLoader brand label={t("common.loading")} />;
  }

  return (
    <div className="app-chrome">
      <AppNav />
      <div className="app-chrome__main">{children}</div>
    </div>
  );
}
