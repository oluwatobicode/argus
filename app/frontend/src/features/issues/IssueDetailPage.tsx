import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useIssue, useUpdateIssueStatus } from "../../hooks/useIssues";
import { useEvents } from "../../hooks/useEvents";
import type { IssueStatus } from "../../types/api";
import { LevelBadge } from "../../ui/LevelBadge";
import { PageLoader } from "../../ui/Loader";
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
  const { projectId = "", issueId = "" } = useParams<{
    projectId: string;
    issueId: string;
  }>();

  const { data: issue, isLoading, isError } = useIssue(projectId, issueId);
  const updateStatus = useUpdateIssueStatus(projectId);

  /* one event per page → the stack-trace stepper walks the occurrences */
  const [eventPage, setEventPage] = useState(1);
  const { data: eventsData } = useEvents(projectId, issueId, eventPage);
  const event = eventsData?.events[0];
  const totalEvents = eventsData?.pagination.total ?? issue?.eventCount ?? 0;

  if (isLoading) return <PageLoader />;
  if (isError || !issue)
    return <p className="text-sm text-error">Couldn't load this issue.</p>;

  const statusMeta = STATUS_META[issue.status];

  return (
    <div className="mx-auto max-w-[1100px]">
      <button
        onClick={() => navigate(`/projects/${projectId}/issues`)}
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 text-xs text-text-2 hover:text-text-1"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> Issues
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
              className={`cursor-pointer rounded-full px-5 py-2.5 text-[13px] transition-colors disabled:opacity-50 ${
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
        <Stat label="STATUS" value={statusMeta.label} color={statusMeta.color} last />
      </div>

      {/* two-column: stack trace + context */}
      <div className="mt-4 grid grid-cols-[1fr_300px] items-start gap-4">
        <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-divider px-5 py-4">
            <div className="text-sm font-semibold">Stack trace</div>
            <div className="flex items-center gap-2">
              <StepButton
                disabled={eventPage <= 1}
                onClick={() => setEventPage((p) => p - 1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
              </StepButton>
              <span className="font-mono text-[11px] text-text-3">
                event {eventPage} of {totalEvents}
              </span>
              <StepButton
                disabled={eventPage >= totalEvents}
                onClick={() => setEventPage((p) => p + 1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </StepButton>
            </div>
          </div>
          {event ? (
            <StackTrace event={event} level={issue.level} />
          ) : (
            <p className="px-5 py-8 text-sm text-text-3">No events stored yet.</p>
          )}
        </div>

        {event && <ContextPanel event={event} />}
      </div>
    </div>
  );
}

function StepButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-7 items-center justify-center rounded-full border border-border-2 text-text-2 transition-colors hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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
