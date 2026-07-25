import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useAdminStats } from "../../hooks/useAdmin";

const fmt = (n: number) => n.toLocaleString();

export function OverviewPage() {
  const { data: stats, isLoading, isError } = useAdminStats();

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
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-4">
          last 30 days
        </div>
        <div className="mt-3 flex flex-wrap gap-8">
          <div>
            <div className="font-mono text-[22px] font-semibold text-lime">
              +{fmt(stats.last30Days.newUsers)}
            </div>
            <div className="mt-1 text-xs text-text-3">new users</div>
          </div>
          <div>
            <div className="font-mono text-[22px] font-semibold text-lime">
              +{fmt(stats.last30Days.newOrganizations)}
            </div>
            <div className="mt-1 text-xs text-text-3">new organizations</div>
          </div>
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
