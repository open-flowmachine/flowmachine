import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";
import type { ProjectIssueFieldDefinitionEntity } from "@/core/domain/project/issue/field/definition/entity";
import { projectIssueFieldTypes } from "@/core/domain/project/issue/field/type";
import { projectProviders } from "@/core/domain/project/provider";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const projectIssueFieldDefinitionCrudServiceInputSchema = {
  create: z.object({
    ctx: ctxSchema,
    payload: z.object({
      type: z.enum(projectIssueFieldTypes),
      name: z.string().min(1).max(256),
      options: z
        .object({
          value: z.string().min(1).max(256),
          label: z.string().min(1).max(256),
        })
        .array(),
      project: z.object({
        id: entityIdSchema,
      }),
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
        projectId: entityIdSchema.optional(),
        name: z.string().optional(),
      })
      .optional(),
  }),

  update: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
      name: z.string().min(1).max(256).optional(),
      options: z
        .object({
          value: z.string().min(1).max(256),
          label: z.string().min(1).max(256),
        })
        .array()
        .optional(),
      integration: z
        .object({
          externalId: z.string().min(1).max(32),
          externalKey: z.string().min(1).max(32),
          provider: z.enum(projectProviders),
        })
        .optional(),
    }),
  }),

  delete: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),
};

interface ProjectIssueFieldDefinitionCrudService {
  create(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.create
    >,
  ): Promise<Result<ProjectIssueFieldDefinitionEntity, Err>>;
  get(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.get
    >,
  ): Promise<Result<ProjectIssueFieldDefinitionEntity, Err>>;
  list(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.list
    >,
  ): Promise<Result<ProjectIssueFieldDefinitionEntity[], Err>>;
  update(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.update
    >,
  ): Promise<Result<ProjectIssueFieldDefinitionEntity, Err>>;
  delete(
    input: z.infer<
      typeof projectIssueFieldDefinitionCrudServiceInputSchema.delete
    >,
  ): Promise<Result<void, Err>>;
}

export {
  type ProjectIssueFieldDefinitionCrudService,
  projectIssueFieldDefinitionCrudServiceInputSchema,
};
