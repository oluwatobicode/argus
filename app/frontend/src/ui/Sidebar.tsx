import { NavLink } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BugIcon,
  ChartLineData01Icon,
  Notification01Icon,
  GaugeIcon,
  Settings01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";
import { useLogout, type User } from "../hooks/useAuth";

const nav = [
  { to: "/", label: "Issues", icon: BugIcon, soon: false },
  {
    to: "/performance",
    label: "Performance",
    icon: ChartLineData01Icon,
    soon: true,
  },
  { to: "/alerts", label: "Alerts", icon: Notification01Icon, soon: true },
  { to: "/usage", label: "Usage", icon: GaugeIcon, soon: true },
  { to: "/settings", label: "Settings", icon: Settings01Icon, soon: true },
];

export function Sidebar({ user }: { user: User }) {
  const logout = useLogout();

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-bg-1 p-4">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        {/* TODO: swap for the real logo once it's ready */}
        <img src="/favicon.svg" alt="" className="h-7 w-7" />
        <span className="font-bold font-mono tracking-tight">argus</span>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 font-sans rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border border-lime/20 bg-lime/10 font-medium text-lime"
                  : "text-text-2 hover:bg-surface hover:text-text-1"
              }`
            }
          >
            <HugeiconsIcon icon={item.icon} size={17} strokeWidth={1.8} />
            {item.label}
            {item.soon && (
              <span className="ml-auto rounded-full border border-border-2 px-2 py-0.5 font-space text-[9px] uppercase tracking-widest text-text-4">
                soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-divider px-2 pt-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs text-text-2">
          {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{user.name ?? "—"}</p>
          <p className="truncate font-mono text-[10px] text-text-3">
            {user.email}
          </p>
        </div>
        <button
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => toast.success("Logged out"),
            })
          }
          title="Log out"
          className="text-text-3 transition-colors hover:text-error"
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
