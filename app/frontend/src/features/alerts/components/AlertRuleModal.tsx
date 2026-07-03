import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../ui/Modal";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { useCreateAlert, useUpdateAlert } from "../../../hooks/useAlerts";
import type { AlertRule } from "../../../types/api";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    notifyEmail: z.string().optional(),
    webhookUrl: z.string().optional(),
  })
  .refine((d) => Boolean(d.notifyEmail?.trim() || d.webhookUrl?.trim()), {
    message: "Add an email or a webhook URL",
    path: ["notifyEmail"],
  })
  .refine((d) => !d.notifyEmail?.trim() || z.email().safeParse(d.notifyEmail).success, {
    message: "Enter a valid email",
    path: ["notifyEmail"],
  })
  .refine((d) => !d.webhookUrl?.trim() || z.url().safeParse(d.webhookUrl).success, {
    message: "Enter a valid URL",
    path: ["webhookUrl"],
  });

type Values = z.infer<typeof schema>;

interface Props {
  projectId: string;
  rule: AlertRule | null; /* null = create, otherwise edit */
  open: boolean;
  onClose: () => void;
}

export function AlertRuleModal({ projectId, rule, open, onClose }: Props) {
  const create = useCreateAlert(projectId);
  const update = useUpdateAlert(projectId);
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: rule?.name ?? "",
      notifyEmail: rule?.notifyEmail ?? "",
      webhookUrl: rule?.webhookUrl ?? "",
    },
  });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: Values) => {
    const input = {
      name: values.name,
      notifyEmail: values.notifyEmail?.trim() || undefined,
      webhookUrl: values.webhookUrl?.trim() || undefined,
    };
    if (rule) {
      update.mutate({ id: rule.id, ...input }, { onSuccess: close });
    } else {
      create.mutate(input, { onSuccess: close });
    }
  };

  return (
    <Modal open={open} onClose={close}>
      <h2 className="text-2xl font-bold tracking-tight">
        {rule ? "Edit alert rule" : "New alert rule"}
      </h2>
      <p className="mt-1 text-sm text-text-2">
        Fire when a new issue first appears — via email, webhook, or both.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          label="Rule name"
          placeholder="New errors in production"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Notify email"
          placeholder="you@company.com"
          error={errors.notifyEmail?.message}
          {...register("notifyEmail")}
        />
        <Input
          label="Webhook URL"
          placeholder="https://hooks.slack.com/…"
          error={errors.webhookUrl?.message}
          {...register("webhookUrl")}
        />

        <div className="mt-2 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {rule ? "Save changes" : "Create rule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
