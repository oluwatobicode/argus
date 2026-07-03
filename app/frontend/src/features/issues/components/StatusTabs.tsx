import type { IssueStatus } from "../../../types/api";

const TABS: { key: IssueStatus; label: string }[] = [
  { key: "UNRESOLVED", label: "Unresolved" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "IGNORED", label: "Ignored" },
];

interface Props {
  active: IssueStatus;
  counts: Record<IssueStatus, number>;
  onChange: (status: IssueStatus) => void;
}

export function StatusTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-colors ${
              isActive
                ? "border-lime/30 bg-lime/10"
                : "border-border-2 bg-surface-2 hover:bg-surface"
            }`}
          >
            <span
              className={`text-[13px] font-semibold ${isActive ? "text-lime" : "text-text-2"}`}
            >
              {tab.label}
            </span>
            <span
              className={`font-mono text-[11px] ${isActive ? "text-lime/70" : "text-text-4"}`}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
