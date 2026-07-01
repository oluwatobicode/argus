import { z } from "zod";

const StackFrameSchema = z.object({
  filename: z.string(),
  function: z.string().optional(),
  lineno: z.number().int().positive(),
  colno: z.number().int().positive().optional(),
});

const ExceptionSchema = z.object({
  type: z.string(),
  value: z.string(),
  stacktrace: z.object({
    frames: z.array(StackFrameSchema).min(1),
  }),
});

const BreadcrumbSchema = z.object({
  type: z.string(),
  message: z.string().optional(),
  timestamp: z.number().positive().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

const ContextsSchema = z.object({
  browser: z
    .object({
      name: z.string(),
      version: z.string(),
    })
    .optional(),
  os: z
    .object({
      name: z.string(),
      version: z.string(),
    })
    .optional(),
});

const EventEnvelopeSchema = z.object({
  level: z
    .enum(["fatal", "error", "warning", "info", "debug"])
    .default("error"),
  timestamp: z.number().positive().optional(),
  environment: z.string().optional(),
  release: z.string().optional(),
  exception: ExceptionSchema,
  user: z
    .object({
      id: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  breadcrumbs: z.array(BreadcrumbSchema).max(100).optional(),
  contexts: ContextsSchema.optional(),
  tags: z.record(z.string(), z.string()).optional(),
  request: z
    .object({
      url: z.string().optional(),
      method: z.string().optional(),
      headers: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export { EventEnvelopeSchema };
export type ValidatedEnvelope = z.infer<typeof EventEnvelopeSchema>;
