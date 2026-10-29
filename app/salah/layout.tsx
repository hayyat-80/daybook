"use client";

import { useTranslation } from "react-i18next";

import { SalahNav } from "@/components/salah/SalahNav";
import { Shell } from "@/components/ui/Shell";

export default function SalahLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <Shell
      title={t("hub.modules.salah.title")}
      subtitle={t("hub.modules.salah.subtitle")}
      backHref="/"
    >
      <SalahNav />
      {children}
    </Shell>
  );
}
