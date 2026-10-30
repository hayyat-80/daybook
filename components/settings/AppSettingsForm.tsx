"use client";

import { useTranslation } from "react-i18next";

import { Field, Select } from "@/components/ui/Field";
import { type AppearanceMode } from "@/design-system/theme";
import { applyLanguage, type AppLanguage } from "@/i18n";
import { useAppStore } from "@/stores/appStore";

export function AppSettingsForm() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  return (
    <div className="stack">
      <Field label={t("settings.appearance")}>
        <Select
          value={settings.appearance}
          onChange={(e) => void setSettings({ appearance: e.target.value as AppearanceMode })}
        >
          <option value="system">{t("settings.system")}</option>
          <option value="light">{t("settings.light")}</option>
          <option value="dark">{t("settings.dark")}</option>
        </Select>
      </Field>
      <Field label={t("settings.language")}>
        <Select
          value={settings.language}
          onChange={(e) => {
            const language = e.target.value as AppLanguage;
            applyLanguage(language);
            void setSettings({ language });
          }}
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="ar">العربية</option>
        </Select>
      </Field>
    </div>
  );
}
