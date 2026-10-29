"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { useTheme } from "@/design-system/theme";

export function FieldLabel({ children }: { children: ReactNode }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <label
      style={{
        display: "block",
        marginBottom: spacing.xs,
        color: colors.textSecondary,
        ...typography.footnote,
      }}
    >
      {children}
    </label>
  );
}

export function TextInput({
  className = "",
  style,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`field-control${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}

export function TextArea({
  className = "",
  style,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`field-control${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}

export function Select({
  className = "",
  style,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`field-control${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <div style={{ marginBottom: spacing.md }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}
