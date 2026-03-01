import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import {
  type AiAgentEntity,
  aiAgentEntityProps,
} from "@/core/domain/ai-agent/entity";
import { entityIdSchema } from "@/core/domain/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const aiAgentCrudServiceInputSchema = {
  create: z.object({
    ctx: ctxSchema,
    payload: z.object({
      name: aiAgentEntityProps.shape.name,
      model: aiAgentEntityProps.shape.model,
      projects: aiAgentEntityProps.shape.projects,
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
      name: aiAgentEntityProps.shape.name.optional(),
      model: aiAgentEntityProps.shape.model.optional(),
      projects: aiAgentEntityProps.shape.projects.optional(),
    }),
  }),

  delete: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),
};

interface AiAgentCrudService {
  create(
    input: z.infer<typeof aiAgentCrudServiceInputSchema.create>,
  ): Promise<Result<void, Err>>;
  get(
    input: z.infer<typeof aiAgentCrudServiceInputSchema.get>,
  ): Promise<Result<AiAgentEntity, Err>>;
  list(
    input: z.infer<typeof aiAgentCrudServiceInputSchema.list>,
  ): Promise<Result<AiAgentEntity[], Err>>;
  update(
    input: z.infer<typeof aiAgentCrudServiceInputSchema.update>,
  ): Promise<Result<void, Err>>;
  delete(
    input: z.infer<typeof aiAgentCrudServiceInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export { type AiAgentCrudService, aiAgentCrudServiceInputSchema };
