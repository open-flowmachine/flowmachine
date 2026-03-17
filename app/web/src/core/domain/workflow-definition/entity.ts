import { z } from "zod/v4";
import { tenantAwareBaseDomainSchema } from "@/core/domain/shared";

const workflowActionSchema = z.object({
  id: z.uuidv7(),
  kind: z.string(),
  name: z.string(),
  inputs: z.record(z.string(), z.unknown()).optional(),
});

const workflowEdgeSchema = z.object({
  from: z.uuidv7(),
  to: z.uuidv7(),
});

export const workflowDefinitionDomainSchema = z.object({
  ...tenantAwareBaseDomainSchema.shape,
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string().nullable(),
  actions: workflowActionSchema.array(),
  edges: workflowEdgeSchema.array(),
  isActive: z.boolean(),
});
export type WorkflowDefinitionDomain = z.infer<
  typeof workflowDefinitionDomainSchema
>;
