import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { FullScreenLoader } from "../../ui/Loader";
import { useLogin, useMe } from "../../hooks/useAuth";
import { ApiError } from "../../api/axiosInstance";

const AdminLoginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginValues = z.infer<typeof AdminLoginSchema>;

export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const { data: me, isLoading } = useMe();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginValues>({ resolver: zodResolver(AdminLoginSchema) });

  if (isLoading) return <FullScreenLoader />;
  /* already authed as an admin — straight in. Non-admin sessions stay here so
     the operator can re-log with the right account. */
  if (me?.isSuperAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = (values: AdminLoginValues) => {
    /* the layout guard verifies isSuperAdmin off the fresh session */
    login.mutate(values, { onSuccess: () => navigate("/admin") });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
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

        <h1 className="text-2xl font-bold font-sans tracking-tight">
          Platform admin
        </h1>
        <p className="mt-1 text-sm font-mono text-text-2">
          Restricted area. Admin accounts only.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          {login.isError && (
            <p className="rounded-xl border border-error/35 bg-error/10 px-3.5 py-2.5 text-xs text-error">
              {login.error instanceof ApiError
                ? login.error.message
                : "Something went wrong"}
            </p>
          )}

          <Button type="submit" loading={login.isPending}>
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
