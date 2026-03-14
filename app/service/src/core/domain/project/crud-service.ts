import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import {
  type ProjectEntity,
  projectEntityProps,
} from "@/core/domain/project/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const projectCrudServiceInputSchema = {
  create: z.object({
    ctx: ctxSchema,
    payload: z.object({
      name: projectEntityProps.shape.name,
      integration: projectEntityProps.shape.integration.optional(),
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
  }),

  update: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
      name: projectEntityProps.shape.name.optional(),
      integration: projectEntityProps.shape.integration.optional(),
    }),
  }),

  delete: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),
};

interface ProjectCrudService {
  create(
    input: z.infer<typeof projectCrudServiceInputSchema.create>,
  ): Promise<Result<void, Err>>;
  get(
    input: z.infer<typeof projectCrudServiceInputSchema.get>,
  ): Promise<Result<ProjectEntity, Err>>;
  list(
    input: z.infer<typeof projectCrudServiceInputSchema.list>,
  ): Promise<Result<ProjectEntity[], Err>>;
  update(
    input: z.infer<typeof projectCrudServiceInputSchema.update>,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<typeof projectCrudServiceInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export { type ProjectCrudService, projectCrudServiceInputSchema };
