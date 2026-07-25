import { useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Analytics01Icon,
  UserMultiple02Icon,
  Building01Icon,
  CreditCardIcon,
  Logout01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { useMe, useLogout } from "../../hooks/useAuth";
import { FullScreenLoader } from "../../ui/Loader";

const NAV: { to: string; label: string; icon: IconSvgElement; end?: boolean }[] = [
  { to: "/admin", label: "Overview", icon: Analytics01Icon, end: true },
  { to: "/admin/users", label: "Users", icon: UserMultiple02Icon },
  { to: "/admin/organizations", label: "Organizations", icon: Building01Icon },
  { to: "/admin/billing", label: "Billing", icon: CreditCardIcon },
];

export function AdminLayout() {
  const { data: me, isLoading, isError } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  if (isLoading) return <FullScreenLoader />;
  if (isError || !me) return <Navigate to="/admin/login" replace />;

  /* real enforcement is server-side (requireSuperAdmin 403s) — this is UX */
  if (!me.isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold">Not an admin account</h1>
        <p className="max-w-sm text-sm text-text-2">
          <span className="font-mono">{me.email}</span> doesn't have platform
          admin access. Log in with an admin account to continue.
        </p>
        <button
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => navigate("/admin/login"),
            })
          }
          className="rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-lime-ink hover:bg-lime/90"
        >
          Switch account
        </button>
      </div>
    );
  }

  const doLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success("Logged out");
        navigate("/admin/login");
      },
    });

  return (
    <div className="flex min-h-screen">
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-bg-1 p-4 transition-transform duration-200 md:static md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden">
            <img
              src="/argus-logo.png"
              alt="Argus"
              className="h-full w-full scale-[3.2] object-contain"
            />
          </div>
          <span className="font-mono font-bold tracking-tight">argus</span>
          <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-lime">
            admin
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setNavOpen(false)}
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
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-divider px-2 pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-xs text-text-2">
            {(me.name ?? me.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{me.name ?? "—"}</p>
            <p className="truncate font-mono text-[10px] text-text-3">
              {me.email}
            </p>
          </div>
          <button
            onClick={doLogout}
            title="Log out"
            className="text-text-3 transition-colors hover:text-error"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-bg-1 p-4 md:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="text-text-2 hover:text-text-1"
          >
            <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
          </button>
          <span className="font-mono font-bold tracking-tight">argus admin</span>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
