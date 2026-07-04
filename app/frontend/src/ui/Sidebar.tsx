import { NavLink, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  BugIcon,
  ChartLineData01Icon,
  Notification01Icon,
  GaugeIcon,
  Settings01Icon,
  CreditCardIcon,
  BookOpen01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";
import { useLogout, type Me } from "../hooks/useAuth";
import { ProjectSwitcher } from "./ProjectSwitcher";

interface NavItem {
  key: string;
  label: string;
  icon: IconSvgElement;
  live: boolean;
}

const PROJECT_NAV: NavItem[] = [
  { key: "issues", label: "Issues", icon: BugIcon, live: true },
  { key: "performance", label: "Performance", icon: ChartLineData01Icon, live: false },
  { key: "alerts", label: "Alerts", icon: Notification01Icon, live: true },
  { key: "settings", label: "Settings", icon: Settings01Icon, live: true },
];

const ORG_NAV: NavItem[] = [
  { key: "usage", label: "Usage", icon: GaugeIcon, live: true },
  { key: "billing", label: "Billing", icon: CreditCardIcon, live: true },
];

interface Props {
  user: Me;
  projectId: string;
}

export function Sidebar({ user, projectId }: Props) {
  const logout = useLogout();
  const navigate = useNavigate();

  const renderItem = (item: NavItem) =>
    item.live ? (
      <NavLink
        key={item.key}
        to={`/projects/${projectId}/${item.key}`}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
            isActive
              ? "border border-lime/20 bg-lime/10 font-medium text-lime"
              : "text-text-2 hover:bg-surface hover:text-text-1"
          }`
        }
      >
        <HugeiconsIcon icon={item.icon} size={17} strokeWidth={1.8} />
        {item.label}
      </NavLink>
    ) : (
      <div
        key={item.key}
        className="flex cursor-default items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-text-3"
      >
        <HugeiconsIcon icon={item.icon} size={17} strokeWidth={1.8} />
        {item.label}
        <span className="ml-auto rounded-full border border-border-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-text-4">
          soon
        </span>
      </div>
    );

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-bg-1 p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        {/* PNG has heavy transparent padding — zoom-crop so the mark fills the box */}
        <div className="flex h-7 w-7 items-center justify-center overflow-hidden">
          <img src="/argus-logo.png" alt="Argus" className="h-full w-full scale-[3.2] object-contain" />
        </div>
        <span className="font-mono font-bold tracking-tight">argus</span>
      </div>

      <ProjectSwitcher projectId={projectId} plan={user.organization?.plan} />

      <SectionLabel>Project</SectionLabel>
      <nav className="flex flex-col gap-1">{PROJECT_NAV.map(renderItem)}</nav>

      <SectionLabel className="mt-6">Organization</SectionLabel>
      <nav className="flex flex-col gap-1">{ORG_NAV.map(renderItem)}</nav>

      <div className="mt-auto flex flex-col gap-1">
        <div className="flex cursor-default items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-text-3">
          <HugeiconsIcon icon={BookOpen01Icon} size={17} strokeWidth={1.8} />
          Docs
          <span className="ml-auto rounded-full border border-border-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-text-4">
            soon
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2.5 border-t border-divider px-2 pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs text-text-2">
            {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user.name ?? "—"}</p>
            <p className="truncate font-mono text-[10px] text-text-3">{user.email}</p>
          </div>
          <button
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => {
                  toast.success("Logged out");
                  navigate("/login");
                },
              })
            }
            title="Log out"
            className="text-text-3 transition-colors hover:text-error"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={`px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-4 ${className}`}
    >
      {children}
    </div>
  );
}
