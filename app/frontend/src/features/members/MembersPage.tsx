import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useMe } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import {
  useMembers,
  useAddMember,
  useUpdateMemberRole,
  useRemoveMember,
} from "../../hooks/useMembers";
import type { MemberRole } from "../../types/api";

const ROLE_STYLE: Record<MemberRole, string> = {
  OWNER: "border-lime/30 bg-lime/10 text-lime",
  ADMIN: "border-info/30 bg-info/10 text-info",
  MEMBER: "border-border-2 bg-surface-2 text-text-3",
};

export function MembersPage() {
  const { data: me } = useMe();
  const { data: members, isLoading } = useMembers();
  const { canManageMembers, canManageOwners } = usePermissions();

  const add = useAddMember();
  const updateRole = useUpdateMemberRole();
  const remove = useRemoveMember();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("MEMBER");

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    add.mutate(
      { email: email.trim(), role },
      { onSuccess: () => setEmail("") },
    );
  };

  /* roles the current user is allowed to assign */
  const assignable: MemberRole[] = canManageOwners
    ? ["OWNER", "ADMIN", "MEMBER"]
    : ["ADMIN", "MEMBER"];

  return (
    <div className="mx-auto max-w-[820px]">
      <Eyebrow>organization</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Members</h1>
      <p className="mt-1.5 text-[13px] text-text-2">
        People with access to {me?.organization?.name ?? "your organization"}.
      </p>

      {/* invite */}
      {canManageMembers && (
        <form
          onSubmit={invite}
          className="mt-6 flex items-center gap-3 rounded-[18px] border border-border bg-surface p-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="h-11 flex-1 rounded-xl border border-border-2 bg-bg-1 px-3.5 font-mono text-[13px] text-text-1 placeholder:text-text-4 focus:border-lime/50 focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            className="h-11 cursor-pointer rounded-xl border border-border-2 bg-surface-2 px-3 text-xs text-text-1"
          >
            {assignable
              .filter((r) => r !== "OWNER")
              .map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
          </select>
          <button
            type="submit"
            disabled={add.isPending}
            className="flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-lime-ink hover:bg-lime/90 disabled:opacity-50"
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={16} strokeWidth={2} />
            Invite
          </button>
        </form>
      )}

      {!canManageMembers && (
        <p className="mt-6 rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-text-3">
          Only owners and admins can invite or manage members.
        </p>
      )}

      {/* list */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {members?.map((m) => {
            const isSelf = m.user.id === me?.id;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-[16px] border border-border bg-surface p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-sm text-text-2">
                  {(m.user.name ?? m.user.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {m.user.name ?? "—"}
                    {isSelf && <span className="ml-1.5 text-text-4">(you)</span>}
                  </div>
                  <div className="truncate font-mono text-[11px] text-text-3">
                    {m.user.email}
                  </div>
                </div>

                {/* role: editable when allowed, else a badge */}
                {canManageMembers && (m.role !== "OWNER" || canManageOwners) ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRole.mutate({
                        id: m.id,
                        role: e.target.value as MemberRole,
                      })
                    }
                    className="h-8 cursor-pointer rounded-full border border-border-2 bg-surface-2 px-3 font-mono text-[11px] uppercase text-text-1"
                  >
                    {assignable.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${ROLE_STYLE[m.role]}`}
                  >
                    {m.role}
                  </span>
                )}

                {canManageMembers && (
                  <button
                    onClick={() => remove.mutate(m.id)}
                    title="Remove"
                    className="text-text-3 hover:text-error disabled:opacity-40"
                    disabled={m.role === "OWNER" && !canManageOwners}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={17} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
