import { z } from "zod/v4";
import { domainIdSchema } from "@/core/domain/shared";

export const createCredentialServicePortInSchema = z.object({
  body: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("apiKey"),
      name: z.string(),
      apiKey: z.string(),
      expiredAt: z.string(),
    }),
    z.object({
      type: z.literal("basic"),
      name: z.string(),
      username: z.string(),
      password: z.string(),
      expiredAt: z.string(),
    }),
  ]),
});
export type CreateCredentialServicePortIn = z.output<
  typeof createCredentialServicePortInSchema
>;

export const deleteCredentialServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type DeleteCredentialServicePortIn = z.output<
  typeof deleteCredentialServicePortInSchema
>;

export const getCredentialServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type GetCredentialServicePortIn = z.output<
  typeof getCredentialServicePortInSchema
>;

export const updateCredentialServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
  body: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("apiKey"),
      name: z.string().optional(),
      apiKey: z.string().optional(),
      expiredAt: z.string().optional(),
    }),
    z.object({
      type: z.literal("basic"),
      name: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      expiredAt: z.string().optional(),
    }),
  ]),
});
export type UpdateCredentialServicePortIn = z.output<
  typeof updateCredentialServicePortInSchema
>;
