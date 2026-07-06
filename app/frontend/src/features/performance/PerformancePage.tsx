import { useState } from "react";
import { useParams } from "react-router";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useTransactions, useVitals } from "../../hooks/usePerformance";
import { relativeTime, absoluteTime } from "../../utils/time";
import type { VitalRating, VitalStat } from "../../types/api";

const WINDOWS = [
  { days: 1, label: "24h" },
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
];

const RATING_COLOR: Record<VitalRating, string> = {
  good: "#A3E635",
  "needs-improvement": "#F59E0B",
  poor: "#F04438",
};

const VITAL_META: { key: "lcp" | "cls" | "fcp" | "ttfb"; label: string; full: string }[] = [
  { key: "lcp", label: "LCP", full: "Largest Contentful Paint" },
  { key: "cls", label: "CLS", full: "Cumulative Layout Shift" },
  { key: "fcp", label: "FCP", full: "First Contentful Paint" },
  { key: "ttfb", label: "TTFB", full: "Time to First Byte" },
];

const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`);

export function PerformancePage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [days, setDays] = useState(7);

  const vitalsQuery = useVitals(projectId, days);
  const txQuery = useTransactions(projectId, days);

  const isLoading = vitalsQuery.isLoading || txQuery.isLoading;
  const transactions = txQuery.data ?? [];
  const vitals = vitalsQuery.data?.vitals;
  const hasData =
    transactions.length > 0 || (vitalsQuery.data?.sampleCount ?? 0) > 0;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>project</Eyebrow>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">
            Performance
          </h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            Web vitals and page-load timing, reported by the browser SDK.
          </p>
        </div>

        <div className="flex gap-1.5">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                days === w.days
                  ? "border-lime/30 bg-lime/10 text-lime"
                  : "border-border-2 bg-surface-2 text-text-2 hover:bg-surface"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !hasData ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border-2 py-16 text-center">
          <div className="text-[15px] font-semibold">No performance data yet</div>
          <div className="max-w-sm text-[13px] text-text-2">
            Page views report automatically once your app runs{" "}
            <span className="font-mono text-text-1">@argusdev/sdk-browser</span>{" "}
            (or sdk-react) with vitals enabled — just browse your app and check
            back.
          </div>
        </div>
      ) : (
        <>
          {/* vitals cards */}
          <div className="grid grid-cols-4 gap-4">
            {VITAL_META.map((meta) => (
              <VitalCard
                key={meta.key}
                label={meta.label}
                full={meta.full}
                stat={vitals?.[meta.key] ?? null}
                isCls={meta.key === "cls"}
              />
            ))}
          </div>

          {/* transactions table */}
          <div className="mt-6 overflow-hidden rounded-[20px] border border-border bg-surface">
            <div className="flex items-center gap-4 border-b border-divider px-[22px] py-3.5">
              <span className="flex-1 font-mono text-[10px] tracking-[0.18em] text-text-4">
                TRANSACTION
              </span>
              <span className="w-16 text-right font-mono text-[10px] tracking-[0.18em] text-text-4">
                COUNT
              </span>
              <span className="w-20 text-right font-mono text-[10px] tracking-[0.18em] text-text-4">
                P50
              </span>
              <span className="w-20 text-right font-mono text-[10px] tracking-[0.18em] text-text-4">
                P75
              </span>
              <span className="w-20 text-right font-mono text-[10px] tracking-[0.18em] text-text-4">
                P95
              </span>
              <span className="w-24 text-right font-mono text-[10px] tracking-[0.18em] text-text-4">
                LAST SEEN
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="px-[22px] py-12 text-center text-[13px] text-text-2">
                No transactions in this window.
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.name}
                  className="flex items-center gap-4 border-b border-divider px-[22px] py-4 last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-1">
                    {tx.name}
                  </span>
                  <span className="w-16 text-right font-mono text-[13px] font-semibold">
                    ×{tx.count}
                  </span>
                  <span className="w-20 text-right font-mono text-xs text-text-2">
                    {fmtMs(tx.p50)}
                  </span>
                  <span className="w-20 text-right font-mono text-xs text-text-1">
                    {fmtMs(tx.p75)}
                  </span>
                  <span className="w-20 text-right font-mono text-xs text-text-2">
                    {fmtMs(tx.p95)}
                  </span>
                  <span
                    className="w-24 text-right text-xs text-text-3"
                    title={absoluteTime(tx.lastSeen)}
                  >
                    {relativeTime(tx.lastSeen)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function VitalCard({
  label,
  full,
  stat,
  isCls,
}: {
  label: string;
  full: string;
  stat: VitalStat | null;
  isCls: boolean;
}) {
  const color = stat ? RATING_COLOR[stat.rating] : "#3A4036";
  return (
    <div className="rounded-[18px] border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-4">
          {label}
        </span>
        {stat && (
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
          />
        )}
      </div>
      <div
        className="mt-2.5 font-mono text-2xl font-semibold"
        style={{ color: stat ? color : "#3A4036" }}
      >
        {stat ? (isCls ? stat.p75 : fmtMs(stat.p75)) : "—"}
      </div>
      <div className="mt-1 text-[11px] text-text-3" title={full}>
        {stat ? `p75 · ${stat.samples} samples` : full}
      </div>
    </div>
  );
}
