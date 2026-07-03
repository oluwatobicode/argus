import { useState } from "react";
import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpDownIcon,
  Tick02Icon,
  ArrowLeft01Icon,
  CodeFolderIcon,
} from "@hugeicons/core-free-icons";
import { useProjects } from "../hooks/useProjects";
import type { Plan } from "../types/api";

interface Props {
  projectId: string;
  plan: Plan | undefined;
}

export function ProjectSwitcher({ projectId, plan }: Props) {
  const { data: projects } = useProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const current = projects?.find((p) => p.id === projectId);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-border-2 bg-surface-2 px-3 py-2.5 text-left hover:bg-surface"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#182114] text-[#9fe871]">
          <HugeiconsIcon icon={CodeFolderIcon} size={17} strokeWidth={1.8} />
        </div>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-1">
          {current?.name ?? "…"}
        </span>
        <HugeiconsIcon
          icon={ArrowUpDownIcon}
          size={14}
          className="text-text-3"
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-border-2 bg-surface p-1.5 shadow-2xl">
            {projects?.map((project) => {
              const isCurrent = project.id === projectId;
              return (
                <button
                  key={project.id}
                  onClick={() => go(`/projects/${project.id}/issues`)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-surface-2"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#182114] text-[#9fe871]">
                    <HugeiconsIcon icon={CodeFolderIcon} size={13} strokeWidth={1.8} />
                  </div>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-1">
                    {project.name}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full border border-border-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-text-3">
                      {plan ?? "FREE"}
                    </span>
                  )}
                  {isCurrent && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={13}
                      className="text-lime"
                    />
                  )}
                </button>
              );
            })}

            <div className="my-1.5 h-px bg-divider" />

            <button
              onClick={() => go("/projects")}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-text-2 hover:bg-surface-2 hover:text-text-1"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={13} />
              <span className="text-xs">All projects</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
