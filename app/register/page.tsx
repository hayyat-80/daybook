"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Field, TextInput } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Loader";
import { PasswordInput } from "@/components/ui/PasswordInput";

function mapError(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "nameRequired":
    case "nameTooShort":
      return t("auth.errors.nameTooShort");
    case "nameTooLong":
      return t("auth.errors.nameTooLong");
    case "emailRequired":
    case "emailInvalid":
      return t("auth.errors.emailInvalid");
    case "emailTaken":
      return t("auth.errors.emailTaken");
    case "passwordRequired":
      return t("auth.errors.passwordRequired");
    case "passwordTooShort":
      return t("auth.errors.passwordTooShort");
    case "passwordTooLong":
      return t("auth.errors.passwordTooLong");
    case "passwordWeak":
      return t("auth.errors.passwordWeak");
    case "passwordMismatch":
      return t("auth.errors.passwordMismatch");
    case "confirmRequired":
      return t("auth.errors.confirmRequired");
    case "registrationClosed":
      return t("auth.registrationClosed");
    default:
      return t("auth.registerFailed");
  }
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"loading" | "open" | "closed">("loading");
  const [bootstrap, setBootstrap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/register", { cache: "no-store" });
        const data = (await res.json()) as { open?: boolean; bootstrap?: boolean };
        if (cancelled) return;
        setBootstrap(Boolean(data.bootstrap));
        setStatus(data.open ? "open" : "closed");
      } catch {
        if (!cancelled) setStatus("closed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
        errors?: Record<string, string>;
      } | null;

      if (!res.ok) {
        if (data?.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) mapped[k] = mapError(v, t);
          setFieldErrors(mapped);
        }
        setError(
          mapError(
            data?.code ??
              (data?.error === "Registration is closed" ? "registrationClosed" : undefined) ??
              Object.values(data?.errors ?? {})[0],
            t,
          ),
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError(t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <PageLoader brand label={t("common.loading")} />;
  }

  if (status === "closed") {
    return (
      <main className="auth-screen">
        <div className="auth-screen__card rise">
          <p className="type-eyebrow">{t("hub.appName")}</p>
          <h1 className="type-display-sm auth-screen__title">{t("auth.registerTitle")}</h1>
          <p className="type-caption auth-screen__hint">{t("auth.registrationClosed")}</p>
          <p className="auth-screen__switch type-caption">
            <Link href="/login" className="auth-screen__link">
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <div className="auth-screen__card rise">
        <p className="type-eyebrow">{t("hub.appName")}</p>
        <h1 className="type-display-sm auth-screen__title">{t("auth.registerTitle")}</h1>
        <p className="type-caption auth-screen__hint">
          {bootstrap ? t("auth.registerBootstrap") : t("auth.registerSubtitle")}
        </p>

        <form className="stack auth-screen__form" onSubmit={onSubmit} noValidate>
          <Field label={t("auth.name")}>
            <TextInput
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? <p className="text-error">{fieldErrors.name}</p> : null}
          </Field>
          <Field label={t("auth.email")}>
            <TextInput
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? <p className="text-error">{fieldErrors.email}</p> : null}
          </Field>
          <Field label={t("auth.password")}>
            <PasswordInput
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            <p className="type-caption auth-screen__rule">{t("auth.passwordHint")}</p>
            {fieldErrors.password ? <p className="text-error">{fieldErrors.password}</p> : null}
          </Field>
          <Field label={t("auth.confirmPassword")}>
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
            {fieldErrors.confirmPassword ? (
              <p className="text-error">{fieldErrors.confirmPassword}</p>
            ) : null}
          </Field>
          {error ? <p className="text-error">{error}</p> : null}
          <button
            type="submit"
            className={`ui-btn ui-btn--primary ui-btn--block${loading ? " ui-btn--loading" : ""}`}
            disabled={loading}
          >
            <span className={loading ? "ui-btn__label--loading" : undefined}>
              {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
            </span>
          </button>
        </form>

        <p className="auth-screen__switch type-caption">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="auth-screen__link">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
