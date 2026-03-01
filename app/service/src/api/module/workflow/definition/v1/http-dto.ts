import z from "zod";
import { entityIdSchema } from "@/core/domain/entity";
import { tenantSchema } from "@/core/domain/tenant-aware-entity";
import { workflowDefinitionCrudServiceInputSchema } from "@/core/domain/workflow/definition/crud-service";
import {
  workflowActionSchema,
  workflowDefinitionEntityProps,
  workflowEdgeSchema,
} from "@/core/domain/workflow/definition/entity";

const workflowDefinitionResponseDtoSchema = z.object({
  id: entityIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  tenant: tenantSchema,
  name: workflowDefinitionEntityProps.shape.name,
  description: workflowDefinitionEntityProps.shape.description,
  projects: workflowDefinitionEntityProps.shape.projects,
  actions: z.array(workflowActionSchema),
  edges: z.array(workflowEdgeSchema),
  isActive: workflowDefinitionEntityProps.shape.isActive,
});
type WorkflowDefinitionResponseDto = z.output<
  typeof workflowDefinitionResponseDtoSchema
>;

const postWorkflowDefinitionRequestBodyDtoSchema = z.object({
  name: workflowDefinitionCrudServiceInputSchema.create.shape.payload.shape
    .name,
  description:
    workflowDefinitionCrudServiceInputSchema.create.shape.payload.shape
      .description,
  projects:
    workflowDefinitionCrudServiceInputSchema.create.shape.payload.shape
      .projects,
  actions:
    workflowDefinitionCrudServiceInputSchema.create.shape.payload.shape.actions,
  edges:
    workflowDefinitionCrudServiceInputSchema.create.shape.payload.shape.edges,
  isActive:
    workflowDefinitionCrudServiceInputSchema.create.shape.payload.shape
      .isActive,
});

const patchWorkflowDefinitionRequestParamsDtoSchema = z.object({
  id: entityIdSchema,
});

const patchWorkflowDefinitionRequestBodyDtoSchema = z.object({
  name: workflowDefinitionEntityProps.shape.name.optional(),
  description: workflowDefinitionEntityProps.shape.description,
  projects: workflowDefinitionEntityProps.shape.projects.optional(),
  actions: workflowDefinitionEntityProps.shape.actions.optional(),
  edges: workflowDefinitionEntityProps.shape.edges.optional(),
  isActive: workflowDefinitionEntityProps.shape.isActive.optional(),
});

const deleteWorkflowDefinitionRequestParamsDtoSchema = z.object({
  id: entityIdSchema,
});

export {
  workflowDefinitionResponseDtoSchema,
  type WorkflowDefinitionResponseDto,
  postWorkflowDefinitionRequestBodyDtoSchema,
  patchWorkflowDefinitionRequestParamsDtoSchema,
  patchWorkflowDefinitionRequestBodyDtoSchema,
  deleteWorkflowDefinitionRequestParamsDtoSchema,
};
