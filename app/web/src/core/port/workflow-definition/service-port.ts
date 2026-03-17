import { z } from "zod/v4";
import { domainIdSchema } from "@/core/domain/shared";
import { workflowDefinitionDomainSchema } from "@/core/domain/workflow-definition/entity";

export const createWorkflowDefinitionServicePortInSchema = z.object({
  body: z.object({
    name: workflowDefinitionDomainSchema.shape.name,
    description: workflowDefinitionDomainSchema.shape.description,
    projectId: workflowDefinitionDomainSchema.shape.projectId,
    actions: workflowDefinitionDomainSchema.shape.actions,
    edges: workflowDefinitionDomainSchema.shape.edges,
    isActive: workflowDefinitionDomainSchema.shape.isActive,
  }),
});
export type CreateWorkflowDefinitionServicePortIn = z.output<
  typeof createWorkflowDefinitionServicePortInSchema
>;

export const deleteWorkflowDefinitionServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type DeleteWorkflowDefinitionServicePortIn = z.output<
  typeof deleteWorkflowDefinitionServicePortInSchema
>;

export const getWorkflowDefinitionServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type GetWorkflowDefinitionServicePortIn = z.output<
  typeof getWorkflowDefinitionServicePortInSchema
>;

export const updateWorkflowDefinitionServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
  body: z.object({
    name: workflowDefinitionDomainSchema.shape.name.optional(),
    description: workflowDefinitionDomainSchema.shape.description,
    projectId: workflowDefinitionDomainSchema.shape.projectId,
    actions: workflowDefinitionDomainSchema.shape.actions.optional(),
    edges: workflowDefinitionDomainSchema.shape.edges.optional(),
    isActive: workflowDefinitionDomainSchema.shape.isActive.optional(),
  }),
});
export type UpdateWorkflowDefinitionServicePortIn = z.output<
  typeof updateWorkflowDefinitionServicePortInSchema
>;
