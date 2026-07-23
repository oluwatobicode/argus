import { useState } from "react";
import { useParams } from "react-router";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useProjects } from "../../hooks/useProjects";
import { useIssueCounts, useIssues } from "../../hooks/useIssues";
import type { IssueStatus, Level } from "../../types/api";
import { StatusTabs } from "./components/StatusTabs";
import { IssueRow } from "./components/IssueRow";

const LEVELS: (Level | "ALL")[] = [
  "ALL",
  "FATAL",
  "ERROR",
  "WARNING",
  "INFO",
  "DEBUG",
];

const EMPTY_COPY: Record<IssueStatus, { title: string; sub: string }> = {
  UNRESOLVED: {
    title: "No errors — nice.",
    sub: "Nothing needs your attention right now.",
  },
  RESOLVED: { title: "Nothing resolved yet", sub: "Fixed issues collect here." },
  IGNORED: { title: "Nothing ignored", sub: "Muted issues collect here." },
};

export function IssuesPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === projectId);

  const [status, setStatus] = useState<IssueStatus>("UNRESOLVED");
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const counts = useIssueCounts(projectId);
  const { data, isLoading, isError } = useIssues({
    projectId,
    status,
    level,
    page,
  });

  const issues = data?.issues ?? [];
  const pagination = data?.pagination;

  const changeStatus = (next: IssueStatus) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>issues</Eyebrow>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">Issues</h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            Errors grouped by fingerprint across{" "}
            <span className="font-mono text-text-1">{project?.name ?? "…"}</span>
          </p>
        </div>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as Level | "ALL");
            setPage(1);
          }}
          className="cursor-pointer rounded-full border border-border-2 bg-surface-2 px-4 py-2 font-mono text-xs text-text-1"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === "ALL" ? "All levels" : l}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-y-2">
        <StatusTabs active={status} counts={counts} onChange={changeStatus} />
        <span className="ml-auto hidden font-mono text-[11px] text-text-4 sm:inline">
          sorted by last seen ↓
        </span>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
        <div className="flex items-center gap-4 border-b border-divider px-4 py-3.5 sm:px-[22px]">
          <span className="w-[9px] shrink-0" />
          <span className="flex-1 font-mono text-[10px] tracking-[0.18em] text-text-4">
            ISSUE
          </span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-4">
            EVENTS · LAST SEEN
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : isError ? (
          <p className="px-[22px] py-16 text-center text-sm text-error">
            Couldn't load issues.
          </p>
        ) : issues.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="text-[15px] font-semibold text-text-1">
              {EMPTY_COPY[status].title}
            </div>
            <div className="mt-1.5 text-[13px] text-text-2">
              {EMPTY_COPY[status].sub}
            </div>
          </div>
        ) : (
          issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-text-3">
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-border-2 bg-surface-2 px-4 py-1.5 font-mono text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-border-2 bg-surface-2 px-4 py-1.5 font-mono text-xs text-text-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
