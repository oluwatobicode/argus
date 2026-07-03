import { z } from "zod";

const base = {
  name: z.string().min(1, "Name is required"),
  type: z.enum(["NEW_ISSUE", "ERROR_RATE"]).default("NEW_ISSUE"),
  threshold: z.number().int().positive().optional(),
  windowMinutes: z.number().int().positive().optional(),
  notifyEmail: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
  enabled: z.boolean().optional(),
};

/* at least one delivery channel is required */
export const CreateAlertSchema = z
  .object(base)
  .refine((d) => Boolean(d.notifyEmail || d.webhookUrl), {
    message: "Provide a notify email or a webhook URL",
    path: ["notifyEmail"],
  });

/* update is partial — any subset of fields */
export const UpdateAlertSchema = z.object(base).partial();

export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type UpdateAlertInput = z.infer<typeof UpdateAlertSchema>;
