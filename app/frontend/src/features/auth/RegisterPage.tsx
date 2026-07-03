import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useRegister } from "../../hooks/useAuth";
import { ApiError } from "../../api/axiosInstance";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

type RegisterValues = z.infer<typeof RegisterSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = (values: RegisterValues) => {
    registerMutation.mutate(values, {
      /* backend sends the OTP — carry the email to the verify screen */
      onSuccess: () => {
        toast.success("Account created — check your email");
        navigate("/verify", { state: { email: values.email } });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-2 font-sans">
          Know when it breaks — before your users do.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Name"
          placeholder="Ada Lovelace"
          error={errors.name?.message}
          {...register("name")}
        />
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
          placeholder="min. 6 characters"
          error={errors.password?.message}
          {...register("password")}
        />

        {registerMutation.isError && (
          <p className="rounded-xl border border-error/35 bg-error/10 px-3.5 py-2.5 text-xs text-error">
            {registerMutation.error instanceof ApiError
              ? registerMutation.error.message
              : "Something went wrong"}
          </p>
        )}

        <Button type="submit" loading={registerMutation.isPending}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-text-3">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-lime hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
