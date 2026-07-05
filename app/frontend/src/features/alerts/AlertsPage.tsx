import { useState } from "react";
import { useParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  Mail01Icon,
  Link01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useAlerts, useDeleteAlert, useUpdateAlert } from "../../hooks/useAlerts";
import { usePermissions } from "../../hooks/usePermissions";
import type { AlertRule } from "../../types/api";
import { AlertRuleModal } from "./components/AlertRuleModal";

export function AlertsPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { data: rules, isLoading } = useAlerts(projectId);
  const update = useUpdateAlert(projectId);
  const del = useDeleteAlert(projectId);
  const { canManageAlerts } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (rule: AlertRule) => {
    setEditing(rule);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="flex items-end justify-between">
        <div>
          <Eyebrow>project</Eyebrow>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">Alerts</h1>
          <p className="mt-1.5 text-[13px] text-text-2">
            Get notified on new issues or error-rate spikes.
          </p>
        </div>
        {canManageAlerts && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-lime-ink hover:bg-lime/90"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            New rule
          </button>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !rules || rules.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border-2 py-16 text-center">
          <div className="mb-2 flex size-11 items-center justify-center rounded-full border border-border-2 text-text-3">
            <HugeiconsIcon icon={Notification01Icon} size={20} strokeWidth={1.8} />
          </div>
          <div className="text-[15px] font-semibold">No alert rules yet</div>
          <div className="max-w-xs text-[13px] text-text-2">
            Create a rule to fire on a new issue or an error spike — via email
            or webhook.
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-5"
              style={{ opacity: rule.enabled ? 1 : 0.55 }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{rule.name}</span>
                  <span className="rounded-full border border-border-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-text-3">
                    {rule.type === "ERROR_RATE" ? "error rate" : "new issue"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-text-3">
                  {rule.type === "ERROR_RATE" && (
                    <span className="text-warning">
                      ≥{rule.threshold} / {rule.windowMinutes}min
                    </span>
                  )}
                  {rule.notifyEmail && (
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Mail01Icon} size={13} /> {rule.notifyEmail}
                    </span>
                  )}
                  {rule.webhookUrl && (
                    <span className="flex items-center gap-1.5 truncate">
                      <HugeiconsIcon icon={Link01Icon} size={13} /> webhook
                    </span>
                  )}
                </div>
              </div>

              {canManageAlerts && (
                <>
                  {/* enabled toggle */}
                  <button
                    onClick={() =>
                      update.mutate({ id: rule.id, enabled: !rule.enabled })
                    }
                    title={rule.enabled ? "Disable" : "Enable"}
                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                      rule.enabled
                        ? "bg-lime"
                        : "bg-surface-2 border border-border-2"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                        rule.enabled ? "left-[18px]" : "left-0.5 bg-text-3"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => openEdit(rule)}
                    title="Edit"
                    className="text-text-3 hover:text-text-1"
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={17} strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => del.mutate(rule.id)}
                    title="Delete"
                    className="text-text-3 hover:text-error"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={17}
                      strokeWidth={1.8}
                    />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertRuleModal
        projectId={projectId}
        rule={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
