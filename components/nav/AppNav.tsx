"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

type NavItem = {
  href: string;
  labelKey: string;
  match: (path: string) => boolean;
  mark: "home" | "salah" | "studies" | "settings";
};

const ITEMS: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.home",
    match: (path) => path === "/",
    mark: "home",
  },
  {
    href: "/salah",
    labelKey: "nav.salah",
    match: (path) => path.startsWith("/salah"),
    mark: "salah",
  },
  {
    href: "/studies",
    labelKey: "nav.studies",
    match: (path) => path.startsWith("/studies"),
    mark: "studies",
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    match: (path) => path.startsWith("/settings"),
    mark: "settings",
  },
];

export function AppNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  if (pathname === "/onboarding") return null;

  return (
    <>
      <nav className="app-nav app-nav--desktop" aria-label={t("nav.label")}>
        <Link href="/" className="app-nav__brand">
          {t("hub.appName")}
        </Link>
        <div className="app-nav__links">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>

      <header className="app-nav app-nav--mobile-top">
        <Link href="/" className="app-nav__brand">
          {t("hub.appName")}
        </Link>
      </header>

      <nav className="app-nav app-nav--mobile" aria-label={t("nav.label")}>
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`app-nav__tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`app-nav__mark mark mark--${item.mark}`} aria-hidden />
              <span className="app-nav__tab-label">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
