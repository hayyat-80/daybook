"use client";

import { useTranslation } from "react-i18next";

import { SemesterPicker } from "@/components/studies/SemesterPicker";
import { StudiesNav } from "@/components/studies/StudiesNav";
import { Shell } from "@/components/ui/Shell";

export default function StudiesLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <Shell
      title={t("studies.title")}
      subtitle={t("studies.subtitle")}
      backHref="/"
      nav={
        <>
          <SemesterPicker />
          <StudiesNav />
        </>
      }
    >
      {children}
    </Shell>
  );
}
