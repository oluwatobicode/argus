import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eyebrow } from "../../ui/Eyebrow";
import { useMe } from "../../hooks/useAuth";
import { useCheckout, usePortal } from "../../hooks/useBilling";
import { useUsage } from "../../hooks/useUsage";
import { usePermissions } from "../../hooks/usePermissions";

const fmt = (n: number) => n.toLocaleString();

const FREE_FEATURES = ["10,000 events / month", "1 project", "30-day retention"];
const PRO_FEATURES = [
  "500,000 events / month",
  "Unlimited projects",
  "90-day retention",
];

export function BillingPage() {
  const { data: me } = useMe();
  const { data: usage } = useUsage();
  const { canManageBilling } = usePermissions();
  const checkout = useCheckout();
  const portal = usePortal();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const isPro = me?.organization?.plan === "PRO";

  const pct =
    usage && usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const meterColor = pct >= 100 ? "#F04438" : pct >= 80 ? "#F59E0B" : "#A3E635";

  /* returning from Polar checkout */
  useEffect(() => {
    if (params.get("upgraded") === "true") {
      toast.success("Payment received — welcome to Pro 🎉");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      params.delete("upgraded");
      setParams(params, { replace: true });
    }
  }, [params, setParams, queryClient]);

  return (
    <div className="mx-auto max-w-[760px]">
      <Eyebrow>organization</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Billing</h1>
      <p className="mt-1.5 text-[13px] text-text-2">
        Powered by Polar. {isPro ? "You're on Pro." : "Upgrade for more headroom."}
      </p>

      {usage && (
        <div className="mt-6 rounded-[18px] border border-border bg-surface p-5">
          <div className="flex items-end justify-between">
            <div className="text-[13px] text-text-2">Events this month</div>
            <div className="font-mono text-xs" style={{ color: meterColor }}>
              {fmt(usage.used)} / {fmt(usage.limit)}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-divider">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${pct}%`, background: meterColor }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <PlanCard
          name="Free"
          price="$0"
          features={FREE_FEATURES}
          current={!isPro}
        />
        <PlanCard
          name="Pro"
          price="$10"
          features={PRO_FEATURES}
          current={isPro}
          highlight
          action={
            !canManageBilling ? (
              <p className="text-center text-xs text-text-3">
                Only the organization owner can change billing.
              </p>
            ) : isPro ? (
              <button
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
                className="w-full rounded-full border border-border-2 bg-surface-2 py-3 text-sm font-medium text-text-1 hover:bg-surface disabled:opacity-50"
              >
                Manage subscription
              </button>
            ) : (
              <button
                onClick={() => checkout.mutate()}
                disabled={checkout.isPending}
                className="w-full rounded-full bg-lime py-3 text-sm font-bold text-lime-ink shadow-[0_4px_20px_rgba(163,230,53,0.2)] hover:bg-lime/90 disabled:opacity-50"
              >
                {checkout.isPending ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            )
          }
        />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  current,
  highlight,
  action,
}: {
  name: string;
  price: string;
  features: string[];
  current?: boolean;
  highlight?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[22px] border p-6 ${
        highlight ? "border-lime/40 bg-surface" : "border-border bg-surface"
      }`}
      style={
        highlight ? { boxShadow: "0 0 40px rgba(163,230,53,0.06)" } : undefined
      }
    >
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold">{name}</div>
        {current && (
          <span className="rounded-full bg-lime/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lime">
            Current
          </span>
        )}
      </div>
      <div className="my-3.5 font-mono text-[32px] font-semibold">
        {price}
        <span className="text-sm font-normal text-text-3">/mo</span>
      </div>
      <div className="flex flex-col gap-2.5 text-[13px] text-text-2">
        {features.map((f) => (
          <div key={f}>· {f}</div>
        ))}
      </div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
