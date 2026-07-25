import { useState } from "react";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useAdminStats, useAdminUsers, useAdminOrganizations } from "../../hooks/useAdmin";
import { relativeTime } from "../../utils/time";
import type { AdminUser, AdminOrganization, Plan } from "../../types/api";

const fmt = (n: number) => n.toLocaleString();

const PLAN_STYLE: Record<Plan, string> = {
  PRO: "border-lime/30 bg-lime/10 text-lime",
  FREE: "border-border-2 bg-surface-2 text-text-3",
};

type Tab = "users" | "organizations";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const stats = useAdminStats();
  const users = useAdminUsers({
    search: search || undefined,
    page,
    enabled: tab === "users",
  });
  const orgs = useAdminOrganizations({
    search: search || undefined,
    page,
    enabled: tab === "organizations",
  });

  const active = tab === "users" ? users : orgs;
  const pagination = active.data?.pagination;

  const changeTab = (next: Tab) => {
    setTab(next);
    setSearch("");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
      <Eyebrow>platform</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Admin</h1>
      <p className="mt-1.5 text-[13px] text-text-2">
        Every user and organization on Argus.
      </p>

      {stats.data && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3 lg:grid-cols-6">
            <StatTile label="users" value={stats.data.totalUsers} />
            <StatTile label="orgs" value={stats.data.totalOrganizations} />
            <StatTile label="pro" value={stats.data.plan.pro} accent />
            <StatTile label="free" value={stats.data.plan.free} />
            <StatTile label="projects" value={stats.data.totalProjects} />
            <StatTile label="events" value={stats.data.totalEventsIngested} />
          </div>
          <p className="mt-3 font-mono text-[11px] text-text-4">
            +{fmt(stats.data.last30Days.newUsers)} users · +
            {fmt(stats.data.last30Days.newOrganizations)} orgs in the last 30
            days
          </p>
        </>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TabButton active={tab === "users"} onClick={() => changeTab("users")}>
            Users
          </TabButton>
          <TabButton
            active={tab === "organizations"}
            onClick={() => changeTab("organizations")}
          >
            Organizations
          </TabButton>
        </div>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={
            tab === "users" ? "Search email or name…" : "Search name or slug…"
          }
          className="h-10 w-full rounded-full border border-border-2 bg-surface-2 px-4 font-mono text-xs text-text-1 placeholder:text-text-4 focus:border-lime/50 focus:outline-none sm:w-64"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-border bg-surface">
        {active.isLoading ? (
          <PageLoader />
        ) : active.isError ? (
          <p className="px-5 py-16 text-center text-sm text-error">
            Couldn't load {tab}.
          </p>
        ) : tab === "users" ? (
          users.data?.users.length ? (
            <div className="flex flex-col divide-y divide-divider">
              {users.data.users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </div>
          ) : (
            <Empty label="users" />
          )
        ) : orgs.data?.organizations.length ? (
          <div className="flex flex-col divide-y divide-divider">
            {orgs.data.organizations.map((o) => (
              <OrgRow key={o.id} org={o} />
            ))}
          </div>
        ) : (
          <Empty label="organizations" />
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-text-3">
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-border-2 bg-surface-2 px-4 py-1.5 font-mono text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-border-2 bg-surface-2 px-4 py-1.5 font-mono text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-4">
      <div
        className={`font-mono text-lg font-semibold sm:text-[22px] ${accent ? "text-lime" : "text-text-1"}`}
      >
        {fmt(value)}
      </div>
      <div className="mt-1 text-[11px] text-text-3">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "border-lime/30 bg-lime/10 text-lime"
          : "border-border-2 bg-surface-2 text-text-2 hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="px-5 py-16 text-center text-sm text-text-3">
      No {label} match your search.
    </p>
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
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${PLAN_STYLE[primary.org.plan]}`}
          title={`${primary.org.name} · ${primary.role}`}
        >
          {primary.org.slug}
          {extra > 0 ? ` +${extra}` : ""}
        </span>
      )}
      <span className="w-20 shrink-0 text-right font-mono text-[11px] text-text-4">
        {relativeTime(user.createdAt)}
      </span>
    </div>
  );
}

function OrgRow({ org }: { org: AdminOrganization }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{org.name}</div>
        <div className="truncate font-mono text-[11px] text-text-3">
          /{org.slug}
        </div>
      </div>
      <span
        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${PLAN_STYLE[org.plan]}`}
      >
        {org.plan}
      </span>
      <span className="font-mono text-[11px] text-text-3">
        {org._count.members} member{org._count.members === 1 ? "" : "s"}
      </span>
      <span className="font-mono text-[11px] text-text-3">
        {org._count.projects} project{org._count.projects === 1 ? "" : "s"}
      </span>
      {org.subscription && (
        <span className="font-mono text-[11px] text-text-4">
          {org.subscription.status}
          {org.subscription.cancelAtPeriodEnd ? " · canceling" : ""}
        </span>
      )}
      <span className="w-20 shrink-0 text-right font-mono text-[11px] text-text-4">
        {relativeTime(org.createdAt)}
      </span>
    </div>
  );
}
