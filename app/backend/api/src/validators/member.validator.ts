import { z } from "zod";

export const AddMemberSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const UpdateMemberSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;
