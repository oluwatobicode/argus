import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../ui/Modal";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { useCreateAlert, useUpdateAlert } from "../../../hooks/useAlerts";
import type { AlertRule, AlertType } from "../../../types/api";

const isPosInt = (s?: string) => Boolean(s && /^\d+$/.test(s) && Number(s) > 0);

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["NEW_ISSUE", "ERROR_RATE"]),
    threshold: z.string().optional(),
    windowMinutes: z.string().optional(),
    notifyEmail: z.string().optional(),
    webhookUrl: z.string().optional(),
  })
  .refine((d) => Boolean(d.notifyEmail?.trim() || d.webhookUrl?.trim()), {
    message: "Add an email or a webhook URL",
    path: ["notifyEmail"],
  })
  .refine(
    (d) => !d.notifyEmail?.trim() || z.email().safeParse(d.notifyEmail).success,
    { message: "Enter a valid email", path: ["notifyEmail"] },
  )
  .refine(
    (d) => !d.webhookUrl?.trim() || z.url().safeParse(d.webhookUrl).success,
    { message: "Enter a valid URL", path: ["webhookUrl"] },
  )
  .refine(
    (d) =>
      d.type !== "ERROR_RATE" ||
      (isPosInt(d.threshold) && isPosInt(d.windowMinutes)),
    {
      message: "Enter a threshold and window (positive numbers)",
      path: ["threshold"],
    },
  );

type Values = z.infer<typeof schema>;

interface Props {
  projectId: string;
  rule: AlertRule | null;
  open: boolean;
  onClose: () => void;
}

const TYPES: { key: AlertType; label: string }[] = [
  { key: "NEW_ISSUE", label: "New issue" },
  { key: "ERROR_RATE", label: "Error rate" },
];

export function AlertRuleModal({ projectId, rule, open, onClose }: Props) {
  const create = useCreateAlert(projectId);
  const update = useUpdateAlert(projectId);
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: rule?.name ?? "",
      type: rule?.type ?? "NEW_ISSUE",
      threshold: rule?.threshold?.toString() ?? "",
      windowMinutes: rule?.windowMinutes?.toString() ?? "",
      notifyEmail: rule?.notifyEmail ?? "",
      webhookUrl: rule?.webhookUrl ?? "",
    },
  });

  const type = watch("type");

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: Values) => {
    const input = {
      name: values.name,
      type: values.type,
      notifyEmail: values.notifyEmail?.trim() || undefined,
      webhookUrl: values.webhookUrl?.trim() || undefined,
      ...(values.type === "ERROR_RATE"
        ? {
            threshold: Number(values.threshold),
            windowMinutes: Number(values.windowMinutes),
          }
        : { threshold: undefined, windowMinutes: undefined }),
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
        {type === "ERROR_RATE"
          ? "Fire when events cross a threshold in a time window."
          : "Fire when a new issue first appears."}{" "}
        Via email, webhook, or both.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        {/* type selector */}
        <div className="flex gap-2">
          {TYPES.map((t) => {
            const active = t.key === type;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setValue("type", t.key)}
                className={`flex-1 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-lime/30 bg-lime/10 text-lime"
                    : "border-border-2 bg-surface-2 text-text-2 hover:bg-surface"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <Input
          label="Rule name"
          placeholder="New errors in production"
          error={errors.name?.message}
          {...register("name")}
        />

        {type === "ERROR_RATE" && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Threshold (events)"
              placeholder="100"
              inputMode="numeric"
              error={errors.threshold?.message}
              {...register("threshold")}
            />
            <Input
              label="Window (minutes)"
              placeholder="5"
              inputMode="numeric"
              {...register("windowMinutes")}
            />
          </div>
        )}

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
