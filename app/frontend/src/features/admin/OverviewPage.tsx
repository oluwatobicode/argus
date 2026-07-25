import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useAdminSignups, useAdminStats } from "../../hooks/useAdmin";
import { SignupsChart } from "./components/SignupsChart";

const fmt = (n: number) => n.toLocaleString();

export function OverviewPage() {
  const { data: stats, isLoading, isError } = useAdminStats();
  const signups = useAdminSignups(30);

  if (isLoading) return <PageLoader />;
  if (isError || !stats)
    return <p className="text-sm text-error">Couldn't load stats.</p>;

  return (
    <div className="mx-auto max-w-[900px]">
      <Eyebrow>platform</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Overview</h1>
      <p className="mt-1.5 text-[13px] text-text-2">
        Everything on Argus at a glance.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="users" value={stats.totalUsers} />
        <StatTile label="orgs" value={stats.totalOrganizations} />
        <StatTile label="pro" value={stats.plan.pro} accent />
        <StatTile label="free" value={stats.plan.free} />
        <StatTile label="projects" value={stats.totalProjects} />
        <StatTile label="events" value={stats.totalEventsIngested} />
      </div>

      <div className="mt-4 rounded-[18px] border border-border bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-4">
            signups · last 30 days
          </div>
          <div className="font-mono text-[11px] text-text-3">
            +{fmt(stats.last30Days.newUsers)} users · +
            {fmt(stats.last30Days.newOrganizations)} orgs
          </div>
        </div>

        <div className="mt-4">
          {signups.isLoading ? (
            <div className="h-[220px] animate-pulse rounded-xl bg-surface-2" />
          ) : signups.isError || !signups.data ? (
            <p className="py-16 text-center text-sm text-error">
              Couldn't load signups.
            </p>
          ) : (
            <SignupsChart series={signups.data.series} />
          )}
        </div>
      </div>
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
