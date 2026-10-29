"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { getCurrentLocation } from "@/services/location/locationService";
import { useAppStore } from "@/stores/appStore";
import { DEFAULT_LOCATION } from "@/types/settings";

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  const slides = [
    { title: t("onboarding.slide1Title"), body: t("onboarding.slide1Body") },
    { title: t("onboarding.slide2Title"), body: t("onboarding.slide2Body") },
    { title: t("onboarding.slide3Title"), body: t("onboarding.slide3Body") },
  ];

  async function finish(useGps: boolean) {
    setBusy(true);
    try {
      const location = useGps
        ? ((await getCurrentLocation()) ?? DEFAULT_LOCATION)
        : DEFAULT_LOCATION;
      await completeOnboarding(location);
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }

  const slide = step < slides.length ? slides[step] : null;

  return (
    <div className="onboarding">
      <div className="onboarding__stage">
        <p className="onboarding__brand">{t("hub.appName")}</p>
        {slide ? (
          <>
            <div className="onboarding__card">
              <p className="onboarding__progress">
                {step + 1} / {slides.length}
              </p>
              <h1 className="onboarding__title">{slide.title}</h1>
              <p className="onboarding__body">{slide.body}</p>
            </div>
            <button
              type="button"
              className="onboarding__btn onboarding__btn--primary"
              onClick={() => setStep((s) => s + 1)}
            >
              {t("onboarding.next")}
            </button>
          </>
        ) : (
          <>
            <div className="onboarding__card">
              <h1 className="onboarding__title">{t("onboarding.locationTitle")}</h1>
              <p className="onboarding__body">{t("onboarding.locationBody")}</p>
            </div>
            <div className="onboarding__actions">
              <button
                type="button"
                className="onboarding__btn onboarding__btn--primary"
                disabled={busy}
                onClick={() => void finish(true)}
              >
                {t("onboarding.enableLocation")}
              </button>
              <button
                type="button"
                className="onboarding__btn onboarding__btn--secondary"
                disabled={busy}
                onClick={() => void finish(false)}
              >
                {t("onboarding.continueDefault")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
