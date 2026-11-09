"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Field, TextInput } from "@/components/ui/Field";
import { PageLoader } from "@/components/ui/Loader";
import { PasswordInput } from "@/components/ui/PasswordInput";

function mapError(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "emailRequired":
    case "emailInvalid":
      return t("auth.errors.emailInvalid");
    case "passwordRequired":
      return t("auth.errors.passwordRequired");
    case "invalidCredentials":
      return t("auth.invalidCredentials");
    default:
      return t("auth.failed");
  }
}

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
        setError(mapError(data?.code ?? Object.values(data?.errors ?? {})[0], t));
        return;
      }

      const next = searchParams.get("next");
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(target);
      router.refresh();
    } catch {
      setError(t("auth.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-screen__card rise">
        <p className="type-eyebrow">{t("hub.appName")}</p>
        <h1 className="type-display-sm auth-screen__title">{t("auth.signInTitle")}</h1>
        <p className="type-caption auth-screen__hint">{t("auth.signInSubtitle")}</p>

        <form className="stack auth-screen__form" onSubmit={onSubmit} noValidate>
          <Field label={t("auth.email")}>
            <TextInput
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? <p className="text-error">{fieldErrors.email}</p> : null}
          </Field>
          <Field label={t("auth.password")}>
            <PasswordInput
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? <p className="text-error">{fieldErrors.password}</p> : null}
          </Field>
          {error ? <p className="text-error">{error}</p> : null}
          <button
            type="submit"
            className={`ui-btn ui-btn--primary ui-btn--block${loading ? " ui-btn--loading" : ""}`}
            disabled={loading}
          >
            <span className={loading ? "ui-btn__label--loading" : undefined}>
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </span>
          </button>
        </form>

        <p className="auth-screen__switch type-caption">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="auth-screen__link">
            {t("auth.createAccount")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<PageLoader brand label={t("common.loading")} />}>
      <LoginForm />
    </Suspense>
  );
}
