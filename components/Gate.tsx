"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { AppNav } from "@/components/nav/AppNav";
import { PageLoader } from "@/components/ui/Loader";
import { useAppStore } from "@/stores/appStore";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";

export function Gate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s.hydrated);
  const timetableHydrated = useTimetableStore((s) => s.hydrated);
  const deadlinesHydrated = useDeadlinesStore((s) => s.hydrated);
  const ready = hydrated && timetableHydrated && deadlinesHydrated;

  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

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
