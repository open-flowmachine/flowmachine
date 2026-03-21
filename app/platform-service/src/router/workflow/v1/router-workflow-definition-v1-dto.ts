import z from "zod";
import { idSchema } from "@/shared/model/model-id";

const workflowDefinitionProjectSchema = z.object({
  id: idSchema,
});

const workflowActionSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  inputs: z.record(z.string(), z.unknown()).optional(),
});

const workflowEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

const workflowDefinitionResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  description: z.string().optional(),
  projects: workflowDefinitionProjectSchema.array(),
  actions: workflowActionSchema.array(),
  edges: workflowEdgeSchema.array(),
  isActive: z.boolean(),
});
type WorkflowDefinitionResponseDto = z.infer<
  typeof workflowDefinitionResponseDtoSchema
>;

const postWorkflowDefinitionRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  projects: workflowDefinitionProjectSchema.array(),
  actions: workflowActionSchema.array(),
  edges: workflowEdgeSchema.array(),
  isActive: z.boolean(),
});

const patchWorkflowDefinitionRequestParamsDtoSchema = z.object({
  id: idSchema,
});

const patchWorkflowDefinitionRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  projects: workflowDefinitionProjectSchema.array().optional(),
  actions: workflowActionSchema.array().optional(),
  edges: workflowEdgeSchema.array().optional(),
  isActive: z.boolean().optional(),
});

const deleteWorkflowDefinitionRequestParamsDtoSchema = z.object({
  id: idSchema,
});

export {
  workflowDefinitionResponseDtoSchema,
  type WorkflowDefinitionResponseDto,
  postWorkflowDefinitionRequestBodyDtoSchema,
  patchWorkflowDefinitionRequestParamsDtoSchema,
  patchWorkflowDefinitionRequestBodyDtoSchema,
  deleteWorkflowDefinitionRequestParamsDtoSchema,
};
