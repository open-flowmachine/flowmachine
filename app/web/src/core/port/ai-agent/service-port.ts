import { z } from "zod/v4";
import { aiAgentDomainSchema } from "@/core/domain/ai-agent/entity";
import { domainIdSchema } from "@/core/domain/shared";

export const createAiAgentServicePortInSchema = z.object({
  body: z.object({
    model: aiAgentDomainSchema.shape.model,
    name: aiAgentDomainSchema.shape.name,
    projects: aiAgentDomainSchema.shape.projects,
  }),
});
export type CreateAiAgentServicePortIn = z.input<
  typeof createAiAgentServicePortInSchema
>;

export const deleteAiAgentServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type DeleteAiAgentServicePortIn = z.output<
  typeof deleteAiAgentServicePortInSchema
>;

export const getAiAgentServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type GetAiAgentServicePortIn = z.output<
  typeof getAiAgentServicePortInSchema
>;

export const updateAiAgentServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
  body: z.object({
    model: aiAgentDomainSchema.shape.model.optional(),
    name: aiAgentDomainSchema.shape.name.optional(),
    projects: aiAgentDomainSchema.shape.projects.optional(),
  }),
});
export type UpdateAiAgentServicePortIn = z.output<
  typeof updateAiAgentServicePortInSchema
>;
