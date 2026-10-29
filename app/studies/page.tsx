"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Shell } from "@/components/ui/Shell";
import { STUDIES_MODULES } from "@/modules/registry";

export default function StudiesPage() {
  const { t } = useTranslation();

  return (
    <Shell title={t("studies.title")} subtitle={t("studies.subtitle")} backHref="/">
      <div className="module-grid">
        {STUDIES_MODULES.map((mod, index) => (
          <Link
            key={mod.id}
            href={mod.href}
            className={`module-card rise-delay-${index + 1}`}
            style={{ ["--module-accent" as string]: mod.accent }}
          >
            <div className="module-card__icon">
              <span className={`mark mark--${mod.mark}`} aria-hidden />
            </div>
            <div className="list-row__body">
              <div className="list-row__title">{t(mod.titleKey)}</div>
              <div className="list-row__meta">{t(mod.subtitleKey)}</div>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
