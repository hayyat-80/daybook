"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAppStore } from "@/stores/appStore";

export function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (!hydrated) return;
    if (!onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
    if (onboardingComplete && pathname === "/onboarding") {
      router.replace("/");
    }
  }, [hydrated, onboardingComplete, pathname, router]);

  if (!hydrated) {
    return (
      <div className="app-shell" style={{ display: "grid", placeItems: "center" }}>
        <div className="hub-brand" style={{ textAlign: "center", margin: 0 }}>
          <p className="hub-brand__name" style={{ fontSize: "clamp(2rem, 8vw, 3rem)" }}>
            Daybook
          </p>
          <p className="hub-brand__tag" style={{ marginInline: "auto" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!onboardingComplete && pathname !== "/onboarding") return null;
  if (onboardingComplete && pathname === "/onboarding") return null;

  return <>{children}</>;
}
