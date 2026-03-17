import { z } from "zod/v4";
import {
  datetimeSchema,
  domainIdSchema,
  tenantAwareBaseDomainSchema,
} from "@/core/domain/shared";

const aiModels = [
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4.5",
  "anthropic/claude-sonnet-4.5",
  "minimax/minimax-m2.1",
  "x-ai/grok-code-fast-1",
  "z-ai/glm-4.7",
] as const;

export const aiAgentDomainSchema = z.object({
  ...tenantAwareBaseDomainSchema.shape,
  model: z.enum(aiModels),
  name: z.string(),
  projects: z.array(
    z.object({
      id: domainIdSchema,
      syncStatus: z.enum(["idle", "pending", "success", "error"]),
      syncedAt: datetimeSchema.nullable(),
    }),
  ),
});
export type AiAgentDomain = z.infer<typeof aiAgentDomainSchema>;
