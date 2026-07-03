import { Navigate, Outlet, useParams } from "react-router";
import { useMe } from "../../hooks/useAuth";
import { Sidebar } from "../../ui/Sidebar";

export function DashboardLayout() {
  const { data: me, isLoading, isError } = useMe();
  const { projectId } = useParams<{ projectId: string }>();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-sm text-text-3">loading…</span>
      </div>
    );
  }

  if (isError || !me) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={me} projectId={projectId ?? ""} />
      <main className="flex-1 overflow-x-hidden p-8">
        <Outlet />
      </main>
    </div>
  );
}
