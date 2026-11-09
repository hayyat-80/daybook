import { USER_ROLES, type UserRole } from "@/types/auth";

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function validateName(name: unknown): string | null {
  if (typeof name !== "string") return "nameRequired";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "nameTooShort";
  if (trimmed.length > 80) return "nameTooLong";
  return null;
}

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string") return "emailRequired";
  const normalized = normalizeEmail(email);
  if (!normalized) return "emailRequired";
  if (normalized.length > 254) return "emailInvalid";
  if (!EMAIL_RE.test(normalized)) return "emailInvalid";
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "passwordRequired";
  if (password.length < 8) return "passwordTooShort";
  if (password.length > 128) return "passwordTooLong";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "passwordWeak";
  }
  return null;
}

export function validateRegisterInput(input: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}): { ok: true; data: { name: string; email: string; password: string } } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const nameErr = validateName(input.name);
  if (nameErr) errors.name = nameErr;
  const emailErr = validateEmail(input.email);
  if (emailErr) errors.email = emailErr;
  const passwordErr = validatePassword(input.password);
  if (passwordErr) errors.password = passwordErr;

  if (
    typeof input.password === "string" &&
    typeof input.confirmPassword === "string" &&
    input.password !== input.confirmPassword
  ) {
    errors.confirmPassword = "passwordMismatch";
  } else if (typeof input.confirmPassword !== "string" || !input.confirmPassword) {
    errors.confirmPassword = "confirmRequired";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name: (input.name as string).trim(),
      email: normalizeEmail(input.email as string),
      password: input.password as string,
    },
  };
}

export function validateLoginInput(input: {
  email?: unknown;
  password?: unknown;
}): { ok: true; data: { email: string; password: string } } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const emailErr = validateEmail(input.email);
  if (emailErr) errors.email = emailErr;
  if (typeof input.password !== "string" || !input.password) {
    errors.password = "passwordRequired";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      email: normalizeEmail(input.email as string),
      password: input.password as string,
    },
  };
}
