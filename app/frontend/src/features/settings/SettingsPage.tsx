import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router";
import { Eyebrow } from "../../ui/Eyebrow";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";
import { CopyButton } from "../../ui/CopyButton";
import { PageLoader } from "../../ui/Loader";
import { InstallTabs } from "./components/InstallTabs";
import {
  useProjects,
  useUpdateProject,
  useDeleteProject,
} from "../../hooks/useProjects";

const nameSchema = z.object({ name: z.string().min(1, "Name is required") });
type NameValues = z.infer<typeof nameSchema>;

export function SettingsPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const project = projects?.find((p) => p.id === projectId);
  const dsn = project?.keys[0]?.dsn ?? "";

  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject();
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* `values` keeps the field in sync once the project finishes loading */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    values: { name: project?.name ?? "" },
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <Eyebrow>project settings</Eyebrow>
      <h1 className="mt-1 text-[28px] font-bold tracking-tight">Settings</h1>

      {/* name */}
      <form
        onSubmit={handleSubmit((v) => updateProject.mutate(v.name))}
        className="mt-8 rounded-[20px] border border-border bg-surface p-6"
        noValidate
      >
        <div className="text-sm font-semibold">Name</div>
        <p className="mt-1 text-xs text-text-2">
          Shown across the dashboard and in alerts.
        </p>
        <div className="mt-4 flex items-start gap-3">
          <div className="flex-1">
            <Input label="" error={errors.name?.message} {...register("name")} />
          </div>
          <Button type="submit" loading={updateProject.isPending}>
            Save
          </Button>
        </div>
      </form>

      {/* DSN */}
      <div className="mt-4 rounded-[20px] border border-border bg-surface p-6">
        <div className="text-sm font-semibold">Client key (DSN)</div>
        <p className="mt-1 text-xs text-text-2">
          The address your SDK sends events to. Safe to ship in client code — it
          can only write events, never read them.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border-2 bg-bg-1 px-4 py-3">
          <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-1">
            {dsn || "—"}
          </code>
          {dsn && <CopyButton value={dsn} label="Copy" />}
        </div>
      </div>

      {/* connect */}
      <div className="mt-4 rounded-[20px] border border-border bg-surface p-6">
        <div className="text-sm font-semibold">Connect your app</div>
        <p className="mt-1 mb-4 text-xs text-text-2">
          Pick your platform, then install the SDK and initialize it once, at
          startup.
        </p>
        <InstallTabs dsn={dsn} />
      </div>

      {/* danger zone */}
      <div className="mt-4 rounded-[20px] border border-error/25 bg-error/5 p-6">
        <div className="text-sm font-semibold text-error">Danger zone</div>
        <p className="mt-1 text-xs text-text-2">
          Deleting a project cascades all of its issues and events. This can't be
          undone.
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          className="mt-4 rounded-full border border-error/35 bg-error/10 px-4 py-2 text-[13px] font-medium text-error hover:bg-error/15"
        >
          Delete project
        </button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="text-xl font-bold tracking-tight">Delete this project?</h2>
        <p className="mt-2 text-sm text-text-2">
          <span className="font-mono text-text-1">{project?.name}</span> and all of
          its issues and events will be permanently removed.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <button
            disabled={deleteProject.isPending}
            onClick={() =>
              deleteProject.mutate(projectId, {
                onSuccess: () => navigate("/projects"),
              })
            }
            className="h-11 rounded-full bg-error px-6 text-sm font-bold text-white hover:bg-error/90 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
