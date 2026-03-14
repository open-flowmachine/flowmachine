import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import { ProjectIssueFieldDefinitionEntity } from "@/core/domain/project/issue/field/definition/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const projectIssueFieldDefinitionCrudRepositoryInputSchema = {
  insert: z.object({
    ctx: ctxSchema,
    data: z.instanceof(ProjectIssueFieldDefinitionEntity),
  }),

  findOne: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
  }),

  findMany: z.object({
    ctx: ctxSchema,
    filter: z
      .object({
        projectId: entityIdSchema.optional(),
        name: z.string().optional(),
      })
      .optional(),
  }),

  update: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
    data: z.instanceof(ProjectIssueFieldDefinitionEntity),
  }),

  delete: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
  }),
};

interface ProjectIssueFieldDefinitionCrudRepository {
  insert(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.insert
    >,
  ): Promise<Result<void, Err>>;
  findOne(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.findOne
    >,
  ): Promise<Result<ProjectIssueFieldDefinitionEntity | null, Err>>;
  findMany(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.findMany
    >,
  ): Promise<Result<ProjectIssueFieldDefinitionEntity[], Err>>;
  update(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.update
    >,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudRepositoryInputSchema.delete
    >,
  ): Promise<Result<void, Err>>;
}

export {
  type ProjectIssueFieldDefinitionCrudRepository,
  projectIssueFieldDefinitionCrudRepositoryInputSchema,
};
