import { Navigate, Outlet } from "react-router";
import { useMe } from "../../hooks/useAuth";

/* gate for authed pages that aren't inside the app sidebar (e.g. the console) */
export function RequireAuth() {
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-sm text-text-3">loading…</span>
      </div>
    );
  }
  if (isError || !me) return <Navigate to="/login" replace />;

  return <Outlet />;
}
