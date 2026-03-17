import { z } from "zod/v4";
import {
  idParamsSchema,
  tenantAwareBaseHttpClientResponseDtoSchema,
} from "@/infra/http-client/shared/http-envelope-schema";

export const workflowActionHttpDtoSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  inputs: z.record(z.string(), z.unknown()).optional(),
});

export const workflowEdgeHttpDtoSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const workflowDefinitionHttpResponseDtoSchema = z.object({
  ...tenantAwareBaseHttpClientResponseDtoSchema.shape,
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string().nullable(),
  actions: workflowActionHttpDtoSchema.array(),
  edges: workflowEdgeHttpDtoSchema.array(),
  isActive: z.boolean(),
});
export type WorkflowDefinitionHttpResponseDto = z.output<
  typeof workflowDefinitionHttpResponseDtoSchema
>;

export const createWorkflowDefinitionHttpRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().optional(),
  projectId: z.string().nullable(),
  actions: workflowActionHttpDtoSchema.array(),
  edges: workflowEdgeHttpDtoSchema.array(),
  isActive: z.boolean(),
});
export type CreateWorkflowDefinitionHttpRequestBodyDto = z.output<
  typeof createWorkflowDefinitionHttpRequestBodyDtoSchema
>;

export const updateWorkflowDefinitionHttpRequestBodyDtoSchema =
  createWorkflowDefinitionHttpRequestBodyDtoSchema.partial();
export type UpdateWorkflowDefinitionHttpRequestBodyDto = z.output<
  typeof updateWorkflowDefinitionHttpRequestBodyDtoSchema
>;

export const createWorkflowDefinitionHttpClientInSchema = z.object({
  payload: createWorkflowDefinitionHttpRequestBodyDtoSchema,
});
export type CreateWorkflowDefinitionHttpClientIn = z.output<
  typeof createWorkflowDefinitionHttpClientInSchema
>;

export const updateWorkflowDefinitionHttpClientInSchema = z.object({
  payload: z.object({
    id: z.string(),
    body: updateWorkflowDefinitionHttpRequestBodyDtoSchema,
  }),
});
export type UpdateWorkflowDefinitionHttpClientIn = z.output<
  typeof updateWorkflowDefinitionHttpClientInSchema
>;

export const deleteWorkflowDefinitionClientInSchema = z.object({
  payload: idParamsSchema,
});
export type DeleteWorkflowDefinitionClientIn = z.output<
  typeof deleteWorkflowDefinitionClientInSchema
>;

export const getWorkflowDefinitionByIdClientInSchema = z.object({
  payload: idParamsSchema,
});
export type GetWorkflowDefinitionByIdClientIn = z.output<
  typeof getWorkflowDefinitionByIdClientInSchema
>;
