import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useResendOtp, useVerifyOtp } from "../../hooks/useAuth";
import { ApiError } from "../../lib/api";

const OtpSchema = z.object({
  otp: z.string().length(6, "The code is 6 characters"),
});

type OtpValues = z.infer<typeof OtpSchema>;

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpValues>({ resolver: zodResolver(OtpSchema) });

  /* arrived here without an email (e.g. hard refresh) — restart the flow */
  if (!email) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-text-2">
          This page needs a pending registration.
        </p>
        <Link to="/register" className="font-medium text-lime hover:underline">
          Back to sign up
        </Link>
      </div>
    );
  }

  const onSubmit = (values: OtpValues) => {
    verify.mutate(
      { email, otp: values.otp },
      {
        onSuccess: () => {
          toast.success("Email verified — log in to continue");
          navigate("/login");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-1 text-sm text-text-2">
          We sent a 6-character code to{" "}
          <span className="font-mono text-text-1">{email}</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Verification code"
          placeholder="A7K2P9"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.otp?.message}
          {...register("otp")}
        />

        {verify.isError && (
          <p className="rounded-xl border border-error/35 bg-error/10 px-3.5 py-2.5 text-xs text-error">
            {verify.error instanceof ApiError
              ? verify.error.message
              : "Something went wrong"}
          </p>
        )}

        <Button type="submit" loading={verify.isPending}>
          Verify
        </Button>
      </form>

      <p className="text-center text-sm text-text-3">
        Nothing arrived?{" "}
        <button
          onClick={() =>
            resend.mutate(
              { email },
              { onSuccess: () => toast.success("Code re-sent") },
            )
          }
          disabled={resend.isPending}
          className="font-medium text-lime hover:underline disabled:opacity-50"
        >
          {resend.isSuccess ? "Sent again ✓" : "Resend code"}
        </button>
      </p>
    </div>
  );
}
