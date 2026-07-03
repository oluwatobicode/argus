import { useNavigate } from "react-router";
import type { Issue } from "../../../types/api";
import { LEVEL_META } from "../../../utils/levels";
import { relativeTime, absoluteTime } from "../../../utils/time";

/* one issue row: level dot · mono title + culprit · ×count + last seen */
export function IssueRow({ issue }: { issue: Issue }) {
  const navigate = useNavigate();
  const { color } = LEVEL_META[issue.level];
  const unresolved = issue.status === "UNRESOLVED";

  return (
    <button
      onClick={() => navigate(`/projects/${issue.projectId}/issues/${issue.id}`)}
      className="flex w-full items-center gap-4 border-b border-divider px-[22px] py-4 text-left transition-colors hover:bg-surface-2"
      style={{ opacity: unresolved ? 1 : 0.5 }}
    >
      <span
        className="h-[9px] w-[9px] shrink-0 rounded-full"
        style={{
          background: color,
          boxShadow: unresolved ? `0 0 10px ${color}80` : "none",
        }}
      />

      <span className="min-w-0 flex-1">
        <span
          className="block truncate font-mono text-[13px] text-text-1"
          style={{
            textDecoration: issue.status === "RESOLVED" ? "line-through" : "none",
          }}
        >
          {issue.title}
        </span>
        <span className="mt-1.5 block truncate font-mono text-[11px] text-text-3">
          {issue.culprit ?? "unknown"} · <span style={{ color }}>{issue.level}</span>
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-mono text-[15px] font-semibold text-text-1">
          ×{issue.eventCount}
        </span>
        <span
          className="mt-1 block text-[11px] text-text-2"
          title={absoluteTime(issue.lastSeen)}
        >
          {relativeTime(issue.lastSeen)}
        </span>
      </span>
    </button>
  );
}
