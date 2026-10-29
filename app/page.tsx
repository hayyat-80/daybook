"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Shell } from "@/components/ui/Shell";
import { APP_MODULES } from "@/modules/registry";
import { formatLocationLabel } from "@/services/location/locationService";
import { useAppStore } from "@/stores/appStore";

export default function HubPage() {
  const { t } = useTranslation();
  const location = useAppStore((s) => s.location);

  return (
    <Shell brand>
      <div className="row row--between" style={{ marginBottom: 8 }}>
        <span className="hub-brand__meta">
          <span className="hub-brand__dot" />
          {formatLocationLabel(location)}
        </span>
        <Link href="/settings" className="ui-btn ui-btn--ghost" style={{ minHeight: 40 }}>
          {t("common.settings")}
        </Link>
      </div>

      <section className="hub-brand">
        <h1 className="hub-brand__name">{t("hub.appName")}</h1>
        <p className="hub-brand__tag">{t("hub.tagline")}</p>
      </section>

      <div className="module-grid">
        {APP_MODULES.filter((m) => m.enabled).map((mod, index) => (
          <Link
            key={mod.id}
            href={mod.href}
            className={`module-card rise-delay-${index + 1}`}
            style={{ ["--module-accent" as string]: mod.accent }}
          >
            <div
              className="module-card__icon"
              style={{
                background: `color-mix(in srgb, ${mod.accent} 16%, transparent)`,
                color: mod.accent,
              }}
            >
              <span className={`mark mark--${mod.mark}`} aria-hidden />
            </div>
            <div className="list-row__body">
              <div className="list-row__title">{t(mod.titleKey)}</div>
              <div className="list-row__meta">{t(mod.subtitleKey)}</div>
            </div>
          </Link>
        ))}
      </div>

      <p
        className="rise rise-delay-3"
        style={{
          marginTop: 28,
          color: "var(--ui-faint)",
          fontSize: "0.8rem",
          textAlign: "center",
          fontWeight: 550,
        }}
      >
        {t("hub.moreComing")}
      </p>
    </Shell>
  );
}
