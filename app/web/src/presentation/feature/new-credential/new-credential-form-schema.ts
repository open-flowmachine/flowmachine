import { z } from "zod/v4";
import { datetimeSchema } from "@/core/domain/shared";

export const newCredentialFormValuesSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("apiKey"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(256, "Name must be 256 characters or less"),
    apiKey: z.string().min(1, "API key is required"),
    expiredAt: datetimeSchema,
  }),
  z.object({
    type: z.literal("basic"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(256, "Name must be 256 characters or less"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    expiredAt: datetimeSchema,
  }),
]);

export type NewCredentialFormValues = z.infer<
  typeof newCredentialFormValuesSchema
>;
