import { z } from "zod/v4";
import { projectDomainSchema } from "@/core/domain/project/entity";

export const newProjectFormValuesSchema = z.object({
  name: projectDomainSchema.shape.name,

  integrationCredentialId:
    projectDomainSchema.shape.integration.unwrap().shape.credentialId,
  integrationDomain:
    projectDomainSchema.shape.integration.unwrap().shape.domain,
  integrationExternalId:
    projectDomainSchema.shape.integration.unwrap().shape.externalId,
  integrationExternalKey:
    projectDomainSchema.shape.integration.unwrap().shape.externalKey,
  integrationProvider:
    projectDomainSchema.shape.integration.unwrap().shape.provider,
  integrationWebhookSecret:
    projectDomainSchema.shape.integration.unwrap().shape.webhookSecret,
});

export type NewProjectFormValues = z.infer<typeof newProjectFormValuesSchema>;
