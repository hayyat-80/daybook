"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
};

export function Button({ variant = "primary", block = false, className = "", ...props }: Props) {
  return (
    <button
      {...props}
      className={`ui-btn ui-btn--${variant}${block ? " ui-btn--block" : ""}${className ? ` ${className}` : ""}`}
    />
  );
}
