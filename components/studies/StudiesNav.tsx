"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const LINKS = [
  {
    href: "/studies",
    key: "timetable.modes.calendar",
    match: (path: string) =>
      path === "/studies" || path.startsWith("/studies/timetable"),
  },
  {
    href: "/studies/courses",
    key: "timetable.modes.courses",
    match: (path: string) => path.startsWith("/studies/courses"),
  },
  {
    href: "/studies/deadlines",
    key: "studies.modules.deadlines.title",
    match: (path: string) => path.startsWith("/studies/deadlines"),
  },
] as const;

export function StudiesNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="segmented rise" aria-label={t("studies.title")}>
      {LINKS.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`segmented__item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
