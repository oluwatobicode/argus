import { Navigate, Outlet } from "react-router";
import { useMe } from "../../hooks/useAuth";
import { FullScreenLoader } from "../../ui/Loader";

/* gate for authed pages that aren't inside the app sidebar (e.g. the console) */
export function RequireAuth() {
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) return <FullScreenLoader />;
  if (isError || !me) return <Navigate to="/login" replace />;
  /* every user must belong to an org — OAuth signups create theirs here */
  if (!me.organization) return <Navigate to="/welcome" replace />;

  return <Outlet />;
}
