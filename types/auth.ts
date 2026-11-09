export const USER_ROLES = ["admin", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
};
