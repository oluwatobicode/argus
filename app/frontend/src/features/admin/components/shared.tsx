import type { Pagination as PaginationInfo, Plan } from "../../../types/api";

const PLAN_STYLE: Record<Plan, string> = {
  PRO: "border-lime/30 bg-lime/10 text-lime",
  FREE: "border-border-2 bg-surface-2 text-text-3",
};

export function PlanBadge({ plan, label }: { plan: Plan; label?: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${PLAN_STYLE[plan]}`}
    >
      {label ?? plan}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-full border border-border-2 bg-surface-2 px-4 font-mono text-xs text-text-1 placeholder:text-text-4 focus:border-lime/50 focus:outline-none sm:w-64"
    />
  );
}

export function Pagination({
  pagination,
  page,
  onPage,
}: {
  pagination: PaginationInfo;
  page: number;
  onPage: (next: number) => void;
}) {
  if (pagination.pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="font-mono text-xs text-text-3">
        Page {pagination.page} of {pagination.pages} · {pagination.total} total
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-full border border-border-2 bg-surface-2 px-4 py-1.5 font-mono text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          disabled={page >= pagination.pages}
          onClick={() => onPage(page + 1)}
          className="rounded-full border border-border-2 bg-surface-2 px-4 py-1.5 font-mono text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
