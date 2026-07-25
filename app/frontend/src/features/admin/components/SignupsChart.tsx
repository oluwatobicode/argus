import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SignupPoint } from "../../../types/api";

/* validated for dark surface #111311 (dataviz six-checks): CVD ΔE 31.5 deutan /
   12.9 tritan, normal 35.9 — all above floor. Brand lime #A3E635 fails the
   lightness band as a data mark, so the series use a darker step. */
const SERIES = [
  { key: "users" as const, label: "Users", color: "#65A30D" },
  { key: "organizations" as const, label: "Organizations", color: "#9333EA" },
];

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="min-w-[128px] rounded-xl border border-border-2 bg-bg-1 px-3 py-2 shadow-lg">
      <div className="font-mono text-[10px] text-text-3">
        {shortDate(label)}
      </div>
      {SERIES.map((s) => {
        const row = payload.find((p) => p.dataKey === s.key);
        return (
          <div key={s.key} className="mt-1 flex items-center gap-2">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="font-mono text-[13px] font-semibold text-text-1">
              {row?.value ?? 0}
            </span>
            <span className="text-[11px] text-text-3">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SignupsChart({ series }: { series: SignupPoint[] }) {
  if (series.length === 0) return null;

  return (
    <div>
      {/* legend lives outside the chart — always present for 2+ series */}
      <div className="mb-3 flex items-center gap-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-[11px] text-text-2">{s.label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={series}
          margin={{ top: 8, right: 8, bottom: 0, left: -22 }}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient
                key={s.key}
                id={`fill-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            stroke="var(--color-border)"
            strokeWidth={1}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            minTickGap={40}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9, fill: "var(--color-text-4)" }}
          />
          <YAxis
            allowDecimals={false}
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9, fill: "var(--color-text-4)" }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--color-border-2)", strokeWidth: 1 }}
          />

          {SERIES.map((s) => (
            <Area
              key={s.key}
              /* linear, not monotone — spline smoothing on discrete daily
                 counts invents values between days and renders a real 0 as a
                 soft trough rather than a floor */
              type="linear"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "var(--color-surface)",
                strokeWidth: 2,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <details className="mt-3">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-text-4 hover:text-text-2">
          table view
        </summary>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                {["Date", "Users", "Organizations"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.date} className="border-t border-divider">
                  <td className="px-3 py-1.5 font-mono text-[11px] text-text-2">
                    {shortDate(p.date)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[11px] tabular-nums text-text-1">
                    {p.users}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[11px] tabular-nums text-text-1">
                    {p.organizations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
