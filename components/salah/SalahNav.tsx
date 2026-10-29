"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const LINKS = [
  { href: "/salah", key: "common.today" },
  { href: "/salah/history", key: "common.history" },
  { href: "/salah/insights", key: "common.insights" },
  { href: "/salah/settings", key: "common.settings" },
] as const;

export function SalahNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="segmented rise" aria-label="Salah">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`segmented__item${active ? " is-active" : ""}`}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
