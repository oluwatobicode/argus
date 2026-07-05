import { z } from "zod";

export const CreateOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Keep it under 60 characters"),
});

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;
