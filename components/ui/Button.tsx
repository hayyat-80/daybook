"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "@/components/ui/Loader";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  loading?: boolean;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  block = false,
  loading = false,
  className = "",
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`ui-btn ui-btn--${variant}${block ? " ui-btn--block" : ""}${loading ? " ui-btn--loading" : ""}${className ? ` ${className}` : ""}`}
    >
      {loading ? <Spinner size="sm" /> : null}
      <span className={loading ? "ui-btn__label ui-btn__label--loading" : "ui-btn__label"}>
        {children}
      </span>
    </button>
  );
}
