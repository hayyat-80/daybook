"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { formatLocationLabel, getCurrentLocation } from "@/services/location/locationService";
import { useAppStore } from "@/stores/appStore";
import type { CalculationMethodId, HighLatitudeRuleId, MadhabId } from "@/types/settings";

const METHODS: CalculationMethodId[] = [
  "MuslimWorldLeague",
  "Egyptian",
  "Karachi",
  "UmmAlQura",
  "Dubai",
  "MoonsightingCommittee",
  "NorthAmerica",
  "Kuwait",
  "Qatar",
  "Singapore",
  "Tehran",
  "Turkey",
];

export default function SalahSettingsPage() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const location = useAppStore((s) => s.location);
  const setSettings = useAppStore((s) => s.setSettings);
  const setLocation = useAppStore((s) => s.setLocation);
  const showToast = useAppStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  async function refreshLocation() {
    setBusy(true);
    try {
      const next = await getCurrentLocation();
      if (!next) {
        showToast("Location unavailable");
        return;
      }
      await setLocation(next);
      showToast(formatLocationLabel(next));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack rise">
      <section className="panel">
        <h2 className="panel__title">{t("settings.location")}</h2>
        <p style={{ margin: "0 0 14px", color: "var(--ui-muted)", lineHeight: 1.45 }}>
          {t("settings.currentLocation")}: {formatLocationLabel(location)}
        </p>
        <Button block loading={busy} onClick={() => void refreshLocation()}>
          {t("settings.autoLocation")}
        </Button>
      </section>

      <section className="panel">
        <h2 className="panel__title">{t("settings.prayer")}</h2>
        <Field label={t("settings.calculationMethod")}>
          <Select
            value={settings.calculationMethod}
            onChange={(e) =>
              void setSettings({ calculationMethod: e.target.value as CalculationMethodId })
            }
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("settings.juristicMethod")}>
          <Select
            value={settings.madhab}
            onChange={(e) => void setSettings({ madhab: e.target.value as MadhabId })}
          >
            <option value="Shafi">Shafi</option>
            <option value="Hanafi">Hanafi</option>
          </Select>
        </Field>
        <Field label={t("settings.highLatitudeRule")}>
          <Select
            value={settings.highLatitudeRule}
            onChange={(e) =>
              void setSettings({ highLatitudeRule: e.target.value as HighLatitudeRuleId })
            }
          >
            <option value="MiddleOfTheNight">Middle of the night</option>
            <option value="SeventhOfTheNight">1/7 of the night</option>
            <option value="TwilightAngle">Twilight angle</option>
          </Select>
        </Field>
      </section>
    </div>
  );
}
