import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoogleIcon, GithubIcon } from "@hugeicons/core-free-icons";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useLogin } from "../../hooks/useAuth";
import { ApiError, oauthUrl } from "../../api/axiosInstance";

const LoginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, {
      onSuccess: (user) => {
        toast.success(
          `Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`,
        );
        navigate("/");
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-sans tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-sm font-mono text-text-2">
          Log in to see what broke while you slept.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={oauthUrl("google")}
          className="flex h-11 items-center justify-center gap-2 rounded-full border border-border-2 bg-surface-2 text-sm hover:bg-surface"
        >
          <HugeiconsIcon icon={GoogleIcon} size={16} /> Google
        </a>
        <a
          href={oauthUrl("github")}
          className="flex h-11 items-center justify-center gap-2 rounded-full border border-border-2 bg-surface-2 text-sm hover:bg-surface"
        >
          <HugeiconsIcon icon={GithubIcon} size={16} /> GitHub
        </a>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-divider" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-4">
          or
        </span>
        <div className="h-px flex-1 bg-divider" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
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

      <p className="text-center text-sm text-text-3">
        No account?{" "}
        <Link to="/register" className="font-medium text-lime hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
