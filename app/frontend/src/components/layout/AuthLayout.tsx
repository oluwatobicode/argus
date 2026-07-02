import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className=" flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border p-8">
        <Outlet />
      </div>
    </div>
  );
}
