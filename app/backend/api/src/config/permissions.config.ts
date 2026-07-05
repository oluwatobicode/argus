/*
 * Single source of truth for role-based permissions.
 * Used by requirePermission middleware AND the /auth/me payload so they never drift.
 */

export const PERMISSIONS = {
  PROJECT_MANAGE: "project:manage",
  ALERT_MANAGE: "alert:manage",
  MEMBER_MANAGE: "member:manage",
  MEMBER_MANAGE_OWNER: "member:manage_owner",
  BILLING_MANAGE: "billing:manage",
  ISSUE_TRIAGE: "issue:triage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  OWNER: [
    PERMISSIONS.PROJECT_MANAGE,
    PERMISSIONS.ALERT_MANAGE,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.MEMBER_MANAGE_OWNER,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.ISSUE_TRIAGE,
  ],
  ADMIN: [
    PERMISSIONS.PROJECT_MANAGE,
    PERMISSIONS.ALERT_MANAGE,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.ISSUE_TRIAGE,
  ],
  MEMBER: [PERMISSIONS.ISSUE_TRIAGE],
};

export function permissionsForRole(role: MemberRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: MemberRole, perm: Permission): boolean {
  return permissionsForRole(role).includes(perm);
}
