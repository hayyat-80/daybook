"use client";

import { useTranslation } from "react-i18next";

import { AppSettingsForm } from "@/components/settings/AppSettingsForm";
import { Shell } from "@/components/ui/Shell";

export default function AppSettingsPage() {
  const { t } = useTranslation();

  return (
    <Shell title={t("settings.title")} subtitle={t("settings.appSubtitle")} backHref="/">
      <div className="stack rise">
        <section className="panel">
          <AppSettingsForm />
        </section>
      </div>
    </Shell>
  );
}
