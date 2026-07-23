import { useNavigate, useParams } from "react-router";
import { Eyebrow } from "../../ui/Eyebrow";
import { CopyButton } from "../../ui/CopyButton";
import { InstallTabs } from "../settings/components/InstallTabs";
import { useProjects } from "../../hooks/useProjects";
import { useFirstEvent } from "../../hooks/useIssues";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { data: projects } = useProjects();
  const project = projects?.find((p) => p.id === projectId);
  const dsn = project?.keys[0]?.dsn ?? "";

  const { data: received } = useFirstEvent(projectId, Boolean(projectId));

  return (
    <div className="ambient-wash min-h-screen">
      <div className="mx-auto max-w-[580px] px-6 py-16">
        <div className="text-center">
          <Eyebrow>project created</Eyebrow>
          <h1 className="mt-2 text-[30px] font-bold tracking-tight">
            Save this DSN now
          </h1>
          <p className="mt-2 text-sm text-text-2">
            Paste it into your SDK. You can always find it again in Settings.
          </p>
        </div>

        {/* DSN */}
        <div className="mt-8 rounded-3xl border border-border bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-4">
            Client key (DSN)
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border-2 bg-bg-1 px-4 py-3">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-1">
              {dsn || "…"}
            </code>
            {dsn && <CopyButton value={dsn} label="Copy" />}
          </div>

          <div className="mt-5">
            <InstallTabs dsn={dsn} />
          </div>
        </div>

        {/* waiting / received */}
        <div className="mt-4">
          {received ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-lime/35 bg-lime/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-lg">🎉</span>
                <div>
                  <div className="text-sm font-semibold text-lime">
                    First event received
                  </div>
                  <div className="text-xs text-text-2">
                    Argus is now watching {project?.name}.
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/projects/${projectId}/issues`)}
                className="shrink-0 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-lime-ink hover:bg-lime/90"
              >
                View issues →
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border-2 px-5 py-4">
              <span className="size-4 animate-spin rounded-full border-2 border-border-2 border-t-lime" />
              <span className="text-sm text-text-2">
                Waiting for your first event…
              </span>
              <button
                onClick={() => navigate(`/projects/${projectId}/issues`)}
                className="ml-auto rounded-full border border-border-2 px-4 py-2 text-xs text-text-2 hover:bg-surface-2"
              >
                Skip to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
