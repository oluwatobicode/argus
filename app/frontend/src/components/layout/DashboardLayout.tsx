import { useState } from "react";
import { Navigate, Outlet, useParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { useMe } from "../../hooks/useAuth";
import { Sidebar } from "../../ui/Sidebar";
import { FullScreenLoader } from "../../ui/Loader";

export function DashboardLayout() {
  const { data: me, isLoading, isError } = useMe();
  const { projectId } = useParams<{ projectId: string }>();
  const [navOpen, setNavOpen] = useState(false);

  if (isLoading) return <FullScreenLoader />;

  if (isError || !me) {
    return <Navigate to="/login" replace />;
  }
  /* every user must belong to an org — OAuth signups create theirs first */
  if (!me.organization) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={me}
        projectId={projectId ?? ""}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-bg-1 p-4 md:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="text-text-2 hover:text-text-1"
          >
            <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
          </button>
          <span className="font-mono font-bold tracking-tight">argus</span>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
