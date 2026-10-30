"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { AppNav } from "@/components/nav/AppNav";
import { PageLoader } from "@/components/ui/Loader";
import { useAppStore } from "@/stores/appStore";
import { useDeadlinesStore } from "@/stores/deadlinesStore";
import { useTimetableStore } from "@/stores/timetableStore";

export function Gate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s.hydrated);
  const timetableHydrated = useTimetableStore((s) => s.hydrated);
  const deadlinesHydrated = useDeadlinesStore((s) => s.hydrated);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const ready = hydrated && timetableHydrated && deadlinesHydrated;

  useEffect(() => {
    if (!ready) return;
    if (!onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
    if (onboardingComplete && pathname === "/onboarding") {
      router.replace("/");
    }
  }, [ready, onboardingComplete, pathname, router]);

  if (!ready) {
    return (
      <div className="app-shell">
        <PageLoader brand label={t("common.loading")} />
      </div>
    );
  }

  if (!onboardingComplete && pathname !== "/onboarding") return null;
  if (onboardingComplete && pathname === "/onboarding") return null;

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  return (
    <div className="app-chrome">
      <AppNav />
      <div className="app-chrome__main">{children}</div>
    </div>
  );
}
