import { z } from "zod/v4";
import {
  idParamsSchema,
  tenantAwareBaseHttpClientResponseDtoSchema,
} from "@/backend/http-client/shared-http-client-schema";

const projectProviders = ["jira", "linear"] as const;

const projectIntegrationHttpResponseDtoSchema = z.object({
  domain: z.string(),
  externalId: z.string(),
  externalKey: z.string(),
  provider: z.enum(projectProviders),
  webhookSecret: z.string(),
  credentialId: z.string(),
});

export const projectHttpResponseDtoSchema = z.object({
  ...tenantAwareBaseHttpClientResponseDtoSchema.shape,
  name: z.string(),
  integration: projectIntegrationHttpResponseDtoSchema.optional(),
});
export type ProjectHttpResponseDto = z.output<
  typeof projectHttpResponseDtoSchema
>;

export const createProjectHttpRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(256),
  integration: projectIntegrationHttpResponseDtoSchema.optional(),
});
export type CreateProjectHttpRequestBodyDto = z.output<
  typeof createProjectHttpRequestBodyDtoSchema
>;

export const createProjectHttpClientInSchema = z.object({
  payload: createProjectHttpRequestBodyDtoSchema,
});
export type CreateProjectHttpClientIn = z.output<
  typeof createProjectHttpClientInSchema
>;

export const deleteProjectClientInSchema = z.object({
  payload: idParamsSchema,
});
export type DeleteProjectClientIn = z.output<
  typeof deleteProjectClientInSchema
>;

export const getProjectByIdClientInSchema = z.object({
  payload: idParamsSchema,
});
export type GetProjectByIdClientIn = z.output<
  typeof getProjectByIdClientInSchema
>;

export const updateProjectHttpRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  integration: projectIntegrationHttpResponseDtoSchema.optional(),
});
export type UpdateProjectHttpRequestBodyDto = z.output<
  typeof updateProjectHttpRequestBodyDtoSchema
>;

export const updateProjectHttpClientInSchema = z.object({
  payload: z.object({
    id: idParamsSchema.shape.id,
    body: updateProjectHttpRequestBodyDtoSchema,
  }),
});
export type UpdateProjectHttpClientIn = z.output<
  typeof updateProjectHttpClientInSchema
>;

export const syncProjectByIdHttpClientInSchema = z.object({
  payload: z.object({
    id: idParamsSchema.shape.id,
  }),
});
export type SyncProjectByIdHttpClientIn = z.output<
  typeof syncProjectByIdHttpClientInSchema
>;
