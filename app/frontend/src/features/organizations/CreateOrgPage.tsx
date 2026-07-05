import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router";
import { Eyebrow } from "../../ui/Eyebrow";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { FullScreenLoader } from "../../ui/Loader";
import { useMe } from "../../hooks/useAuth";
import { useCreateOrganization } from "../../hooks/useOrganization";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Keep it under 60 characters"),
});
type Values = z.infer<typeof schema>;

/* /welcome — onboarding for org-less users (OAuth signups) */
export function CreateOrgPage() {
  const navigate = useNavigate();
  const { data: me, isLoading, isError } = useMe();
  const create = useCreateOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  if (isLoading) return <FullScreenLoader />;
  if (isError || !me) return <Navigate to="/login" replace />;
  /* already has an org — nothing to onboard */
  if (me.organization) return <Navigate to="/projects" replace />;

  const onSubmit = (values: Values) => {
    create.mutate(values.name, { onSuccess: () => navigate("/projects") });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Eyebrow>welcome to argus</Eyebrow>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Create your organization
        </h1>
        <p className="mt-1 text-sm text-text-2">
          Projects, teammates, and billing all live inside it. You can invite
          your team later.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Organization name"
          placeholder="Acme Inc"
          error={errors.name?.message}
          {...register("name")}
        />
        <Button type="submit" loading={create.isPending}>
          Create organization
        </Button>
      </form>
    </div>
  );
}
