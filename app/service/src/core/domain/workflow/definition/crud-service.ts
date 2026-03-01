import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import {
  type WorkflowDefinitionEntity,
  workflowDefinitionEntityProps,
} from "@/core/domain/workflow/definition/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const workflowDefinitionCrudServiceInputSchema = {
  create: z.object({
    ctx: ctxSchema,
    payload: z.object({
      name: workflowDefinitionEntityProps.shape.name,
      description: workflowDefinitionEntityProps.shape.description,
      projects: workflowDefinitionEntityProps.shape.projects,
      actions: workflowDefinitionEntityProps.shape.actions,
      edges: workflowDefinitionEntityProps.shape.edges,
      isActive: workflowDefinitionEntityProps.shape.isActive,
    }),
  }),

  get: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),

  list: z.object({
    ctx: ctxSchema,
    filter: z
      .object({
        projectId: entityIdSchema,
      })
      .optional(),
  }),

  update: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
      name: workflowDefinitionEntityProps.shape.name.optional(),
      description: workflowDefinitionEntityProps.shape.description,
      projects: workflowDefinitionEntityProps.shape.projects.optional(),
      actions: workflowDefinitionEntityProps.shape.actions.optional(),
      edges: workflowDefinitionEntityProps.shape.edges.optional(),
      isActive: workflowDefinitionEntityProps.shape.isActive.optional(),
    }),
  }),

  delete: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),
};

interface WorkflowDefinitionCrudService {
  create(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.create>,
  ): Promise<Result<void, Err>>;
  get(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.get>,
  ): Promise<Result<WorkflowDefinitionEntity, Err>>;
  list(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.list>,
  ): Promise<Result<WorkflowDefinitionEntity[], Err>>;
  update(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.update>,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<typeof workflowDefinitionCrudServiceInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export {
  type WorkflowDefinitionCrudService,
  workflowDefinitionCrudServiceInputSchema,
};
