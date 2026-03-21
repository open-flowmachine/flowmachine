import { z } from "zod/v4";
import { datetimeSchema } from "@/lib/schema";

export const editCredentialFormValuesSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("apiKey"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(256, "Name must be 256 characters or less")
      .optional(),
    apiKey: z.string().optional(),
    expiredAt: datetimeSchema.optional(),
  }),
  z.object({
    type: z.literal("basic"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(256, "Name must be 256 characters or less")
      .optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    expiredAt: datetimeSchema.optional(),
  }),
]);

export type EditCredentialFormValues = z.infer<
  typeof editCredentialFormValuesSchema
>;
