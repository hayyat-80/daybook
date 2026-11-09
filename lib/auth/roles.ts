import type { UserRole } from "@/types/auth";

/** Role rank — higher includes lower privileges for future gates. */
const ROLE_RANK: Record<UserRole, number> = {
  user: 1,
  admin: 2,
};

export function hasMinRole(role: UserRole | null | undefined, minimum: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return hasMinRole(role, "admin");
}
