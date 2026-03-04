import { z } from "zod/v4";
import { aiAgentDomainSchema } from "@/domain/entity/ai-agent/ai-agent-domain-schema";
import { domainIdSchema } from "@/domain/entity/shared-schema";

export const newAiAgentFormValuesSchema = z.object({
  name: aiAgentDomainSchema.shape.name,
  model: aiAgentDomainSchema.shape.model,
  projects: z.array(domainIdSchema),
});

export type NewAiAgentFormValues = z.infer<typeof newAiAgentFormValuesSchema>;
