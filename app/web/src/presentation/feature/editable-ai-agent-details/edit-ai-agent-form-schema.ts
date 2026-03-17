import { z } from "zod/v4";
import { aiAgentDomainSchema } from "@/core/domain/ai-agent/entity";
import { domainIdSchema } from "@/core/domain/shared";

export const editAiAgentFormValuesSchema = z.object({
  name: aiAgentDomainSchema.shape.name,
  model: aiAgentDomainSchema.shape.model,
  projects: z.array(domainIdSchema),
});

export type EditAiAgentFormValues = z.infer<typeof editAiAgentFormValuesSchema>;
