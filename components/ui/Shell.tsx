"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Chevron } from "@/components/ui/Chevron";

type ShellProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  nav?: ReactNode;
  children: ReactNode;
  brand?: boolean;
};

export function Shell({
  title,
  subtitle,
  backHref,
  backLabel,
  action,
  nav,
  children,
  brand = false,
}: ShellProps) {
  const { t } = useTranslation();
  const showHeader = Boolean((backHref || title || action) && !brand);

  return (
    <div className={`app-shell${brand ? " app-shell--brand" : ""}`}>
      {showHeader ? (
        <header className="app-shell__header">
          <div className="app-shell__header-main">
            {backHref ? (
              <Link
                href={backHref}
                className={`app-shell__back${backHref === "/" ? " app-shell__back--root" : ""}`}
              >
                <Chevron direction="left" />
                {backLabel ?? t("hub.backHome")}
              </Link>
            ) : null}
            {title ? <h1 className="app-shell__title">{title}</h1> : null}
            {subtitle ? <p className="app-shell__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="app-shell__action">{action}</div> : null}
        </header>
      ) : null}
      {nav ? <div className="app-shell__nav">{nav}</div> : null}
      <div className="app-shell__scroll">{children}</div>
    </div>
  );
}
