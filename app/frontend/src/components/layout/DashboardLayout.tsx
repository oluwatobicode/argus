import { Navigate, Outlet, useParams } from "react-router";
import { useMe } from "../../hooks/useAuth";
import { Sidebar } from "../../ui/Sidebar";
import { FullScreenLoader } from "../../ui/Loader";

export function DashboardLayout() {
  const { data: me, isLoading, isError } = useMe();
  const { projectId } = useParams<{ projectId: string }>();

  if (isLoading) return <FullScreenLoader />;

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
