import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import { GitRepositoryEntity } from "@/core/domain/git-repository/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const gitRepositoryCrudRepositoryInputSchema = {
  insert: z.object({
    ctx: ctxSchema,
    data: z.instanceof(GitRepositoryEntity),
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
    data: z.instanceof(GitRepositoryEntity),
  }),

  delete: z.object({
    ctx: ctxSchema,
    id: entityIdSchema,
  }),
};

interface GitRepositoryCrudRepository {
  insert(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.insert>,
  ): Promise<Result<void, Err>>;
  findOne(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.findOne>,
  ): Promise<Result<GitRepositoryEntity | null, Err>>;
  findMany(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.findMany>,
  ): Promise<Result<GitRepositoryEntity[], Err>>;
  update(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.update>,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<typeof gitRepositoryCrudRepositoryInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export {
  type GitRepositoryCrudRepository,
  gitRepositoryCrudRepositoryInputSchema,
};
