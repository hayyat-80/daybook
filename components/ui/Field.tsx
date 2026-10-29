"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="field__label">{children}</label>;
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field-control${className ? ` ${className}` : ""}`} />;
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`field-control${className ? ` ${className}` : ""}`} />;
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`field-control${className ? ` ${className}` : ""}`} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}
