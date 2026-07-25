import { useState } from "react";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useAdminOrganizations } from "../../hooks/useAdmin";
import { relativeTime } from "../../utils/time";
import type { AdminOrganization } from "../../types/api";
import { Pagination, PlanBadge, SearchInput } from "./components/shared";

export function AdminOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminOrganizations({
    search: search || undefined,
    page,
  });

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>platform</Eyebrow>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">
            Organizations
          </h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            Every organization and its plan.
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name or slug…"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-border bg-surface">
        {isLoading ? (
          <PageLoader />
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-error">
            Couldn't load organizations.
          </p>
        ) : data?.organizations.length ? (
          <div className="flex flex-col divide-y divide-divider">
            {data.organizations.map((o) => (
              <OrgRow key={o.id} org={o} />
            ))}
          </div>
        ) : (
          <p className="px-5 py-16 text-center text-sm text-text-3">
            No organizations match your search.
          </p>
        )}
      </div>

      {data?.pagination && (
        <Pagination pagination={data.pagination} page={page} onPage={setPage} />
      )}
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
      <PlanBadge plan={org.plan} />
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
