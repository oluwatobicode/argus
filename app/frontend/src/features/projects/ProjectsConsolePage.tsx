import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Logout01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { Eyebrow } from "../../ui/Eyebrow";
import { PageLoader } from "../../ui/Loader";
import { useMe, useLogout } from "../../hooks/useAuth";
import { useProjects } from "../../hooks/useProjects";
import { usePermissions } from "../../hooks/usePermissions";
import { NewProjectModal } from "./components/NewProjectModal";

export function ProjectsConsolePage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: projects, isLoading } = useProjects();
  const logout = useLogout();
  const { canManageProjects } = usePermissions();
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const org = me?.organization;
  const initials = (org?.name ?? "?").slice(0, 2).toUpperCase();
  const count = projects?.length ?? 0;

  /* returning from Bachs checkout — this is where BACHS_SUCCESS_URL actually
   * redirects to, not the billing page. The webhook that flips the org to PRO
   * runs async and may lag this redirect, so retry the invalidate once. */
  useEffect(() => {
    if (params.get("upgraded") === "true") {
      toast.success("Payment received — welcome to Pro 🎉");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      const retry = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }, 3000);
      params.delete("upgraded");
      setParams(params, { replace: true });
      return () => clearTimeout(retry);
    }
  }, [params, setParams, queryClient]);

  return (
    <div className=" min-h-screen">
      <div className="mx-auto max-w-[1000px] px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#182114] text-[#9fe871] font-mono text-xs font-bold">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold">{org?.name ?? "…"}</div>
              <div className="font-mono text-[11px] text-text-3">
                /{org?.slug ?? ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageProjects && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center font-sans text-black cursor-pointer gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-bold hover:bg-lime/90"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
                New project
              </button>
            )}
            <button
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("Logged out");
                    navigate("/login");
                  },
                })
              }
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border-2 bg-surface-2 px-5 py-2.5 text-sm text-text-2 hover:bg-surface"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
              Logout
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between">
          <div>
            <Eyebrow>your projects</Eyebrow>
            <h1 className="mt-1 text-[40px] font-sans font-bold tracking-tight">
              Projects
            </h1>
          </div>
          <span className="font-mono text-sm text-text-3">
            {count} {count === 1 ? "project" : "projects"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2">
              <PageLoader />
            </div>
          ) : (
            projects?.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}/issues`)}
                className="group cursor-pointer rounded-3xl border border-border bg-surface p-6 text-left transition-colors hover:border-border-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold">{project.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-text-3">
                      /{project.slug}
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={18}
                    className="text-text-4 transition-colors group-hover:text-lime"
                  />
                </div>
                <div className="mt-6 flex gap-2">
                  <span className="rounded-full bg-surface-2 px-3 py-1 font-mono text-[11px] text-text-2">
                    {project.platform ?? "browser"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
