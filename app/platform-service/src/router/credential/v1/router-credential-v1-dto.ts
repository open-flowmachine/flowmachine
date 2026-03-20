import z from "zod";
import { credentialTypes } from "@/module/credential/credential-model";
import { idSchema } from "@/shared/model/model-id";

const postCredentialRequestBodyDtoSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(credentialTypes[0]),
    name: z.string().min(1).max(256),
    apiKey: z.string().min(1).max(256),
    expiredAt: z.coerce.date(),
  }),
  z.object({
    type: z.literal(credentialTypes[1]),
    name: z.string().min(1).max(256),
    username: z.string().min(1).max(256),
    password: z.string().min(1).max(256),
    expiredAt: z.coerce.date(),
  }),
]);

const patchCredentialRequestParamsDtoSchema = z.object({
  id: idSchema,
});

const patchCredentialRequestBodyDtoSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(credentialTypes[0]),
    name: z.string().min(1).max(256).optional(),
    apiKey: z.string().min(1).max(256).optional(),
    expiredAt: z.coerce.date().optional(),
  }),
  z.object({
    type: z.literal(credentialTypes[1]),
    name: z.string().min(1).max(256).optional(),
    username: z.string().min(1).max(256).optional(),
    password: z.string().min(1).max(256).optional(),
    expiredAt: z.coerce.date().optional(),
  }),
]);

const deleteCredentialRequestParamsDtoSchema = z.object({
  id: idSchema,
});

const credentialResponseDtoSchema = z.discriminatedUnion("type", [
  z.object({
    id: idSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    type: z.literal(credentialTypes[0]),
    name: z.string(),
    apiKey: z.string(),
    expiredAt: z.date(),
  }),
  z.object({
    id: idSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    type: z.literal(credentialTypes[1]),
    name: z.string(),
    username: z.string(),
    password: z.string(),
    expiredAt: z.date(),
  }),
]);
type CredentialResponseDto = z.infer<typeof credentialResponseDtoSchema>;

export {
  credentialResponseDtoSchema,
  type CredentialResponseDto,
  postCredentialRequestBodyDtoSchema,
  patchCredentialRequestParamsDtoSchema,
  patchCredentialRequestBodyDtoSchema,
  deleteCredentialRequestParamsDtoSchema,
};
