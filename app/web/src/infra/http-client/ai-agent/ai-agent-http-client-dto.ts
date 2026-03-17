import { z } from "zod/v4";
import {
  idParamsSchema,
  tenantAwareBaseHttpClientResponseDtoSchema,
} from "@/infra/http-client/shared/http-envelope-schema";

const aiModels = [
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4.5",
  "anthropic/claude-sonnet-4.5",
  "minimax/minimax-m2.1",
  "x-ai/grok-code-fast-1",
  "z-ai/glm-4.7",
] as const;

const projectHttpResponseDtoSchema = z.object({
  id: z.string(),
  syncStatus: z.enum(["idle", "pending", "success", "error"]),
  syncedAt: z.iso.datetime().nullable(),
});

export const aiAgentHttpResponseDtoSchema = z.object({
  ...tenantAwareBaseHttpClientResponseDtoSchema.shape,
  model: z.enum(aiModels),
  name: z.string(),
  projects: z.array(projectHttpResponseDtoSchema),
});
export type AiAgentHttpResponseDto = z.output<
  typeof aiAgentHttpResponseDtoSchema
>;

export const createAiAgentHttpRequestBodyDtoSchema = z.object({
  model: z.enum(aiModels),
  name: z.string().min(1).max(256),
  projects: z.array(projectHttpResponseDtoSchema),
});
export type CreateAiAgentHttpRequestBodyDto = z.output<
  typeof createAiAgentHttpRequestBodyDtoSchema
>;

export const createAiAgentHttpClientInSchema = z.object({
  payload: createAiAgentHttpRequestBodyDtoSchema,
});
export type CreateAiAgentHttpClientIn = z.output<
  typeof createAiAgentHttpClientInSchema
>;

export const deleteAiAgentClientInSchema = z.object({
  payload: idParamsSchema,
});
export type DeleteAiAgentClientIn = z.output<
  typeof deleteAiAgentClientInSchema
>;

export const getAiAgentByIdClientInSchema = z.object({
  payload: idParamsSchema,
});
export type GetAiAgentByIdClientIn = z.output<
  typeof getAiAgentByIdClientInSchema
>;

export const updateAiAgentHttpRequestBodyDtoSchema = z.object({
  model: z.enum(aiModels).optional(),
  name: z.string().min(1).max(256).optional(),
  projects: z.array(projectHttpResponseDtoSchema).optional(),
});
export type UpdateAiAgentHttpRequestBodyDto = z.output<
  typeof updateAiAgentHttpRequestBodyDtoSchema
>;

export const updateAiAgentHttpClientInSchema = z.object({
  payload: z.object({
    id: idParamsSchema.shape.id,
    body: updateAiAgentHttpRequestBodyDtoSchema,
  }),
});
export type UpdateAiAgentHttpClientIn = z.output<
  typeof updateAiAgentHttpClientInSchema
>;
