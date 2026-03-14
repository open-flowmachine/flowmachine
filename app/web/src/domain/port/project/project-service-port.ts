import { z } from "zod/v4";
import { projectDomainSchema } from "@/domain/entity/project/project-domain-schema";
import { domainIdSchema } from "@/domain/entity/shared-schema";

export const createProjectServicePortInSchema = z.object({
  body: z.object({
    name: projectDomainSchema.shape.name,
    integration: projectDomainSchema.shape.integration,
  }),
});
export type CreateProjectServicePortIn = z.output<
  typeof createProjectServicePortInSchema
>;

export const deleteProjectServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type DeleteProjectServicePortIn = z.output<
  typeof deleteProjectServicePortInSchema
>;

export const getProjectServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type GetProjectServicePortIn = z.output<
  typeof getProjectServicePortInSchema
>;

export const updateProjectServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
  body: z.object({
    name: projectDomainSchema.shape.name.optional(),
    integration: projectDomainSchema.shape.integration,
  }),
});
export type UpdateProjectServicePortIn = z.output<
  typeof updateProjectServicePortInSchema
>;

export const syncProjectServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type SyncProjectServicePortIn = z.output<
  typeof syncProjectServicePortInSchema
>;
