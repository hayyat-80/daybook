"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className = "", ...props }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`field-control password-input__control${className ? ` ${className}` : ""}`}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.7a2.75 2.75 0 003.7 3.7M7.1 7.4C4.7 8.8 3 12 3 12s3.5 6.5 9.5 6.5c1.7 0 3.2-.4 4.5-1M9.9 5.6C10.6 5.4 11.3 5.5 12 5.5 18 5.5 21.5 12 21.5 12c-.4.8-1 1.7-1.7 2.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
