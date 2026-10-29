"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/design-system/theme";

type ShellProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  brand?: boolean;
};

export function Shell({
  title,
  subtitle,
  backHref,
  backLabel,
  action,
  children,
  style,
  brand = false,
}: ShellProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="app-shell" style={{ color: colors.text, ...style }}>
      {(backHref || title || action) && !brand ? (
        <header className="app-shell__header">
          <div className="app-shell__header-main">
            {backHref ? (
              <Link href={backHref} className="app-shell__back">
                ← {backLabel ?? t("hub.backHome")}
              </Link>
            ) : null}
            {title ? <h1 className="app-shell__title">{title}</h1> : null}
            {subtitle ? <p className="app-shell__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="app-shell__action">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
