"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Field, TextInput } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";

type ProfileUser = {
  id: string;
  email: string;
  name: string;
};

function mapError(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "nameTooShort":
    case "nameRequired":
      return t("auth.errors.nameTooShort");
    case "nameTooLong":
      return t("auth.errors.nameTooLong");
    case "emailInvalid":
    case "emailRequired":
      return t("auth.errors.emailInvalid");
    case "emailTaken":
      return t("auth.errors.emailTaken");
    case "passwordRequired":
      return t("auth.errors.passwordRequired");
    case "passwordTooShort":
      return t("auth.errors.passwordTooShort");
    case "passwordWeak":
      return t("auth.errors.passwordWeak");
    case "passwordIncorrect":
      return t("auth.errors.passwordIncorrect");
    default:
      return t("settings.profileSaveFailed");
  }
}

export function UserProfileCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: ProfileUser };
        if (!cancelled && data.user) {
          setUser(data.user);
          setName(data.user.name);
          setEmail(data.user.email);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startEdit() {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setCurrentPassword("");
    setNewPassword("");
    setFieldErrors({});
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    setCurrentPassword("");
    setNewPassword("");
    setFieldErrors({});
    setError(null);
    setEditing(false);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const body: Record<string, string> = { name, email };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        user?: ProfileUser;
        errors?: Record<string, string>;
        error?: string;
      } | null;
      if (!res.ok) {
        if (data?.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) mapped[k] = mapError(v, t);
          setFieldErrors(mapped);
        }
        setError(mapError(Object.values(data?.errors ?? {})[0], t));
        return;
      }
      if (data?.user) {
        setUser(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
      }
      setCurrentPassword("");
      setNewPassword("");
      setEditing(false);
    } catch {
      setError(t("settings.profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (!user) return null;

  return (
    <section className="settings-account">
      <div className="settings-account__header">
        <p className="type-eyebrow">{t("settings.profile")}</p>
        {!editing ? (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--compact" onClick={startEdit}>
            {t("settings.editProfile")}
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="settings-account__identity">
          <p className="settings-account__name">{user.name}</p>
          <p className="type-caption">{user.email}</p>
        </div>
      ) : (
        <form className="stack" onSubmit={onSave} noValidate>
          <Field label={t("auth.name")}>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name ? <p className="text-error">{fieldErrors.name}</p> : null}
          </Field>
          <Field label={t("auth.email")}>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? <p className="text-error">{fieldErrors.email}</p> : null}
          </Field>
          <Field label={t("settings.newPasswordOptional")}>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.newPassword)}
            />
            <p className="type-caption auth-screen__rule">{t("settings.newPasswordHint")}</p>
            {fieldErrors.newPassword ? (
              <p className="text-error">{fieldErrors.newPassword}</p>
            ) : null}
          </Field>
          {newPassword ? (
            <Field label={t("settings.currentPassword")}>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-invalid={Boolean(fieldErrors.currentPassword)}
              />
              {fieldErrors.currentPassword ? (
                <p className="text-error">{fieldErrors.currentPassword}</p>
              ) : null}
            </Field>
          ) : null}
          {error ? <p className="text-error">{error}</p> : null}
          <div className="settings-account__actions">
            <button
              type="button"
              className="ui-btn ui-btn--secondary"
              onClick={cancelEdit}
              disabled={saving}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className={`ui-btn ui-btn--primary${saving ? " ui-btn--loading" : ""}`}
              disabled={saving}
            >
              <span className={saving ? "ui-btn__label--loading" : undefined}>
                {saving ? t("common.saving") : t("common.save")}
              </span>
            </button>
          </div>
        </form>
      )}

      <p className="type-caption">{t("settings.accountHint")}</p>
      <button
        type="button"
        className={`ui-btn ui-btn--secondary ui-btn--block${signingOut ? " ui-btn--loading" : ""}`}
        onClick={() => void signOut()}
        disabled={signingOut}
      >
        <span className={signingOut ? "ui-btn__label--loading" : undefined}>
          {signingOut ? t("auth.signingOut") : t("auth.signOut")}
        </span>
      </button>
    </section>
  );
}
