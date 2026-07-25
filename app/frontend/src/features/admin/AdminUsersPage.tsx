import { useState } from "react";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useAdminUsers } from "../../hooks/useAdmin";
import { relativeTime } from "../../utils/time";
import type { AdminUser } from "../../types/api";
import { Pagination, PlanBadge, SearchInput } from "./components/shared";

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminUsers({
    search: search || undefined,
    page,
  });

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>platform</Eyebrow>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">Users</h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            Every registered account.
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search email or name…"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-border bg-surface">
        {isLoading ? (
          <PageLoader />
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-error">
            Couldn't load users.
          </p>
        ) : data?.users.length ? (
          <div className="flex flex-col divide-y divide-divider">
            {data.users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>
        ) : (
          <p className="px-5 py-16 text-center text-sm text-text-3">
            No users match your search.
          </p>
        )}
      </div>

      {data?.pagination && (
        <Pagination pagination={data.pagination} page={page} onPage={setPage} />
      )}
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const primary = user.memberships[0];
  const extra = user.memberships.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-sm text-text-2">
        {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate text-sm font-medium">
          {user.name ?? "—"}
          {user.isSuperAdmin && (
            <span className="rounded-full border border-lime/30 bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-lime">
              admin
            </span>
          )}
          {!user.emailVerified && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-warning">
              unverified
            </span>
          )}
        </div>
        <div className="truncate font-mono text-[11px] text-text-3">
          {user.email}
        </div>
      </div>
      {primary && (
        <span title={`${primary.org.name} · ${primary.role}`}>
          <PlanBadge
            plan={primary.org.plan}
            label={`${primary.org.slug}${extra > 0 ? ` +${extra}` : ""}`}
          />
        </span>
      )}
      <span className="w-20 shrink-0 text-right font-mono text-[11px] text-text-4">
        {relativeTime(user.createdAt)}
      </span>
    </div>
  );
}
