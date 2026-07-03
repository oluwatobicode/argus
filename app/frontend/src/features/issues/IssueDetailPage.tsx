import { useNavigate, useParams } from "react-router";
import { useProjects } from "../../hooks/useProjects";
import { useIssue, useUpdateIssueStatus } from "../../hooks/useIssues";
import type { IssueStatus } from "../../types/api";
import { LevelBadge } from "../../ui/LevelBadge";
import { STATUS_META } from "../../utils/levels";
import { relativeTime, absoluteTime } from "../../utils/time";
import { StackTrace } from "./components/StackTrace";
import { ContextPanel } from "./components/ContextPanel";

/* status → the action buttons shown in the header */
function actionsFor(
  status: IssueStatus,
): { label: string; to: IssueStatus; primary: boolean }[] {
  if (status === "UNRESOLVED")
    return [
      { label: "Resolve", to: "RESOLVED", primary: true },
      { label: "Ignore", to: "IGNORED", primary: false },
    ];
  if (status === "RESOLVED")
    return [{ label: "Unresolve", to: "UNRESOLVED", primary: false }];
  return [
    { label: "Unignore", to: "UNRESOLVED", primary: false },
    { label: "Resolve", to: "RESOLVED", primary: true },
  ];
}

export function IssueDetailPage() {
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  const { data: projects } = useProjects();
  const project = projects?.[0];

  const {
    data: issue,
    isLoading,
    isError,
  } = useIssue(project?.id ?? "", issueId ?? "");
  const updateStatus = useUpdateIssueStatus(project?.id ?? "");

  if (isLoading)
    return <p className="font-mono text-sm text-text-3">loading…</p>;
  if (isError || !issue)
    return <p className="text-sm text-error">Couldn't load this issue.</p>;

  const statusMeta = STATUS_META[issue.status];
  const latestEvent = issue.events[0];

  return (
    <div className="mx-auto max-w-[1100px]">
      <button
        onClick={() => navigate("/")}
        className="mb-5 cursor-pointer inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text-1"
      >
        ← Issues
      </button>

      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-3.5">
            <LevelBadge level={issue.level} />
          </div>
          <h1 className="break-words font-mono text-xl font-semibold leading-snug text-text-1">
            {issue.title}
          </h1>
          <div className="mt-2 font-mono text-xs text-text-3">
            {issue.culprit ?? "unknown"}
          </div>
        </div>
        <div className="flex shrink-0 gap-2.5">
          {actionsFor(issue.status).map((action) => (
            <button
              key={action.to}
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate({ issueId: issue.id, status: action.to })
              }
              className={`rounded-full cursor-pointer px-5 py-2.5 text-[13px] transition-colors disabled:opacity-50 ${
                action.primary
                  ? "bg-lime font-bold text-lime-ink hover:bg-lime/90"
                  : "border border-border-2 bg-surface-2 text-text-1 hover:bg-surface"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* stats strip */}
      <div className="mt-6 flex overflow-hidden rounded-[18px] border border-border bg-surface">
        <Stat label="EVENTS" value={`×${issue.eventCount}`} mono />
        <Stat
          label="FIRST SEEN"
          value={relativeTime(issue.firstSeen)}
          title={absoluteTime(issue.firstSeen)}
        />
        <Stat
          label="LAST SEEN"
          value={relativeTime(issue.lastSeen)}
          title={absoluteTime(issue.lastSeen)}
        />
        <Stat
          label="STATUS"
          value={statusMeta.label}
          color={statusMeta.color}
          last
        />
      </div>

      {/* two-column: stack trace + context */}
      <div className="mt-4 grid grid-cols-[1fr_300px] items-start gap-4">
        <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-divider px-5 py-4">
            <div className="text-sm font-semibold">Stack trace</div>
            <span className="font-mono text-[11px] text-text-3">
              latest of {issue.eventCount} events
            </span>
          </div>
          {latestEvent ? (
            <StackTrace event={latestEvent} level={issue.level} />
          ) : (
            <p className="px-5 py-8 text-sm text-text-3">
              No events stored yet.
            </p>
          )}

          {issue.events.length > 0 && (
            <div className="border-t border-divider px-5 py-4">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-4">
                Recent events
              </div>
              <div className="flex flex-col gap-2">
                {issue.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between font-mono text-xs"
                  >
                    <span className="text-text-2">{event.id.slice(0, 12)}</span>
                    <span
                      className="text-text-3"
                      title={absoluteTime(event.timestamp)}
                    >
                      {relativeTime(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {latestEvent && <ContextPanel event={latestEvent} />}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  mono,
  last,
  title,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
  last?: boolean;
  title?: string;
}) {
  return (
    <div
      className={`flex-1 px-[22px] py-[18px] ${last ? "" : "border-r border-divider"}`}
    >
      <div className="font-mono text-[10px] tracking-[0.16em] text-text-4">
        {label}
      </div>
      <div
        className={`mt-2 text-[15px] font-medium ${mono ? "font-mono text-2xl" : ""}`}
        style={{ color: color ?? "#ECEFE8" }}
        title={title}
      >
        {value}
      </div>
    </div>
  );
}
