import { useNavigate, useParams } from "react-router";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useUsage } from "../../hooks/useUsage";

const fmt = (n: number) => n.toLocaleString();

export function UsagePage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { data: usage, isLoading, isError } = useUsage();

  if (isLoading) return <PageLoader />;
  if (isError || !usage)
    return <p className="text-sm text-error">Couldn't load usage.</p>;

  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const near = pct >= 80 && pct < 100;
  const over = pct >= 100;
  const meterColor = over ? "#F04438" : near ? "#F59E0B" : "#A3E635";

  return (
    <div className="mx-auto max-w-[820px]">
      <Eyebrow>organization</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Usage</h1>
      <p className="mt-1.5 text-[13px] text-text-2">
        {usage.month} · {usage.plan === "PRO" ? "Pro" : "Free"} plan
      </p>

      {/* meter */}
      <div className="mt-6 rounded-[20px] border border-border bg-surface p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[13px] text-text-2">Events this month</div>
            <div className="mt-1.5 font-mono text-[32px] font-semibold">
              {fmt(usage.used)}{" "}
              <span className="text-base font-normal text-text-3">
                / {fmt(usage.limit)}
              </span>
            </div>
          </div>
          <div className="font-mono text-[13px]" style={{ color: meterColor }}>
            {Math.round(pct)}% used
          </div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-divider">
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${pct}%`, background: meterColor }}
          />
        </div>

        {(near || over) && (
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: over ? "rgba(240,68,56,0.07)" : "rgba(245,158,11,0.07)",
              border: `1px solid ${over ? "rgba(240,68,56,0.25)" : "rgba(245,158,11,0.25)"}`,
            }}
          >
            <span className="flex-1 text-xs" style={{ color: meterColor }}>
              {over
                ? "You've hit your quota — new events are being dropped."
                : "You're approaching your quota. Over-limit events are dropped."}
            </span>
            <button
              onClick={() => navigate(`/projects/${projectId}/billing`)}
              className="shrink-0 rounded-full bg-lime px-4 py-2 text-xs font-bold text-lime-ink hover:bg-lime/90"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard label="errors" value={usage.breakdown.errors} />
        <StatCard label="warnings" value={usage.breakdown.warnings} />
        <StatCard label="info / debug" value={usage.breakdown.info} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-border bg-surface p-5">
      <div className="font-mono text-[22px] font-semibold">{fmt(value)}</div>
      <div className="mt-1 text-xs text-text-3">{label}</div>
    </div>
  );
}
