import type { Result } from "neverthrow";
import z from "zod";
import { mongoCtxSchema } from "@/common/ctx/mongo-ctx";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { entityIdSchema } from "@/core/domain/entity";

const ctxSchema = z.object({
  ...mongoCtxSchema.shape,
  ...tenantCtxSchema.shape,
});

const projectServiceInputSchema = {
  delete: z.object({
    ctx: ctxSchema,
    payload: z.object({
      id: entityIdSchema,
    }),
  }),
};

interface ProjectService {
  delete(
    input: z.infer<typeof projectServiceInputSchema.delete>,
  ): Promise<Result<void, Err>>;
}

export { type ProjectService, projectServiceInputSchema };
