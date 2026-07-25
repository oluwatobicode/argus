import { Eyebrow } from "../../ui/Eyebrow";

export function AdminBillingPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <Eyebrow>platform</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Billing</h1>
      <p className="mt-1.5 text-[13px] text-text-2">
        Revenue across all organizations.
      </p>

      <div className="mt-6 rounded-[20px] border border-dashed border-border-2 px-6 py-16 text-center">
        <div className="text-[15px] font-semibold text-text-1">
          Revenue reporting coming soon
        </div>
        <div className="mt-1.5 text-[13px] text-text-2">
          Waiting on the Bachs revenue endpoint — this page will show MRR,
          payments, and per-org revenue once it's wired up.
        </div>
      </div>
    </div>
  );
}
