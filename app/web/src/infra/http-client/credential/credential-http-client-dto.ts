import { z } from "zod/v4";
import {
  idParamsSchema,
  tenantAwareBaseHttpClientResponseDtoSchema,
} from "@/infra/http-client/shared/http-envelope-schema";

export const credentialHttpResponseDtoSchema = z.discriminatedUnion("type", [
  z.object({
    ...tenantAwareBaseHttpClientResponseDtoSchema.shape,
    type: z.literal("apiKey"),
    name: z.string(),
    apiKey: z.string(),
    expiredAt: z.iso.datetime(),
  }),
  z.object({
    ...tenantAwareBaseHttpClientResponseDtoSchema.shape,
    type: z.literal("basic"),
    name: z.string(),
    username: z.string(),
    password: z.string(),
    expiredAt: z.iso.datetime(),
  }),
]);
export type CredentialHttpResponseDto = z.output<
  typeof credentialHttpResponseDtoSchema
>;

export const createCredentialHttpRequestBodyDtoSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.literal("apiKey"),
      name: z.string().min(1).max(256),
      apiKey: z.string().min(1).max(256),
      expiredAt: z.string(),
    }),
    z.object({
      type: z.literal("basic"),
      name: z.string().min(1).max(256),
      username: z.string().min(1).max(256),
      password: z.string().min(1).max(256),
      expiredAt: z.string(),
    }),
  ],
);
export type CreateCredentialHttpRequestBodyDto = z.output<
  typeof createCredentialHttpRequestBodyDtoSchema
>;

export const createCredentialHttpClientInSchema = z.object({
  payload: createCredentialHttpRequestBodyDtoSchema,
});
export type CreateCredentialHttpClientIn = z.output<
  typeof createCredentialHttpClientInSchema
>;

export const deleteCredentialClientInSchema = z.object({
  payload: idParamsSchema,
});
export type DeleteCredentialClientIn = z.output<
  typeof deleteCredentialClientInSchema
>;

export const getCredentialByIdClientInSchema = z.object({
  payload: idParamsSchema,
});
export type GetCredentialByIdClientIn = z.output<
  typeof getCredentialByIdClientInSchema
>;

export const updateCredentialHttpRequestBodyDtoSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.literal("apiKey"),
      name: z.string().min(1).max(256).optional(),
      apiKey: z.string().min(1).max(256).optional(),
      expiredAt: z.string().optional(),
    }),
    z.object({
      type: z.literal("basic"),
      name: z.string().min(1).max(256).optional(),
      username: z.string().min(1).max(256).optional(),
      password: z.string().min(1).max(256).optional(),
      expiredAt: z.string().optional(),
    }),
  ],
);
export type UpdateCredentialHttpRequestBodyDto = z.output<
  typeof updateCredentialHttpRequestBodyDtoSchema
>;

export const updateCredentialHttpClientInSchema = z.object({
  payload: z.object({
    id: idParamsSchema.shape.id,
    body: updateCredentialHttpRequestBodyDtoSchema,
  }),
});
export type UpdateCredentialHttpClientIn = z.output<
  typeof updateCredentialHttpClientInSchema
>;
