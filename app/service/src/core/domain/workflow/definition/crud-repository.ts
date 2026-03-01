import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import { WorkflowDefinitionEntity } from "@/core/domain/workflow/definition/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const workflowDefinitionCrudRepositoryInputSchema = {
  insert: z.object({
    ctx: ctxSchema,
    data: z.instanceof(WorkflowDefinitionEntity),
  }),

  findOne: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
  }),

  findMany: z.object({
    ctx: ctxSchema,
    filter: z
      .object({
        projectId: entityIdSchema,
      })
      .optional(),
  }),

  update: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
    data: z.instanceof(WorkflowDefinitionEntity),
  }),

  delete: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
  }),
};

interface WorkflowDefinitionCrudRepository {
  insert(
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.insert>,
  ): Promise<Result<void, Err>>;
  findOne(
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.findOne>,
  ): Promise<Result<WorkflowDefinitionEntity | null, Err>>;
  findMany(
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.findMany>,
  ): Promise<Result<WorkflowDefinitionEntity[], Err>>;
  update(
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.update>,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<typeof workflowDefinitionCrudRepositoryInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export {
  type WorkflowDefinitionCrudRepository,
  workflowDefinitionCrudRepositoryInputSchema,
};
