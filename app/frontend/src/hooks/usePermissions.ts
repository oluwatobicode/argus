import { useMe } from "./useAuth";
import type { Permission } from "../types/api";

/* reads the current user's org permission array (from /auth/me) */
export function usePermissions() {
  const { data: me } = useMe();
  const permissions = me?.organization?.permissions ?? [];
  const role = me?.organization?.role;

  const can = (perm: Permission) => permissions.includes(perm);

  return {
    role,
    can,
    isOwner: role === "OWNER",
    canManageProjects: can("project:manage"),
    canManageAlerts: can("alert:manage"),
    canManageMembers: can("member:manage"),
    canManageOwners: can("member:manage_owner"),
    canManageBilling: can("billing:manage"),
  };
}
