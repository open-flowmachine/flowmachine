import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import {
  type GitRepositoryEntity,
  gitRepositoryEntityProps,
} from "@/core/domain/git-repository/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const gitRepositoryCrudServiceInputSchema = {
  create: z.object({
    ctx: ctxSchema,
    payload: z.object({
      name: gitRepositoryEntityProps.shape.name,
      url: gitRepositoryEntityProps.shape.url,
      config: gitRepositoryEntityProps.shape.config,
      integration: gitRepositoryEntityProps.shape.integration,
      projects: gitRepositoryEntityProps.shape.projects,
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
      name: gitRepositoryEntityProps.shape.name.optional(),
      url: gitRepositoryEntityProps.shape.url.optional(),
      config: gitRepositoryEntityProps.shape.config.optional(),
      integration: gitRepositoryEntityProps.shape.integration.optional(),
      projects: gitRepositoryEntityProps.shape.projects.optional(),
    }),
  }),

  delete: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),
};

interface GitRepositoryCrudService {
  create(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.create>,
  ): Promise<Result<void, Err>>;
  get(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.get>,
  ): Promise<Result<GitRepositoryEntity, Err>>;
  list(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.list>,
  ): Promise<Result<GitRepositoryEntity[], Err>>;
  update(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.update>,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<typeof gitRepositoryCrudServiceInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export { type GitRepositoryCrudService, gitRepositoryCrudServiceInputSchema };
