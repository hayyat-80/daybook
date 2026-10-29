"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "muted" | "danger";
  children: ReactNode;
};

export function IconButton({
  label,
  tone = "muted",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-btn icon-btn--${tone}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TrashIcon() {
  return (
    <svg
      className="icon-btn__glyph"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M9 7V5.8c0-.7.5-1.3 1.2-1.3h3.6c.7 0 1.2.6 1.2 1.3V7" />
      <path d="M18.2 7l-.7 12.1a1.6 1.6 0 0 1-1.6 1.5H8.1a1.6 1.6 0 0 1-1.6-1.5L5.8 7" />
      <path d="M10 11v5.5" />
      <path d="M14 11v5.5" />
    </svg>
  );
}
