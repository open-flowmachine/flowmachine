import { z } from "zod/v4";
import { idSchema } from "@/lib/schema";
import { projectProviders } from "@/module/project/project-type";

export const editProjectFormValuesSchema = z.object({
  name: z.string(),

  integrationCredentialId: idSchema,
  integrationDomain: z.string(),
  integrationExternalId: z.string(),
  integrationExternalKey: z.string(),
  integrationProvider: z.enum(projectProviders),
  integrationWebhookSecret: z.string(),
});

export type EditProjectFormValues = z.infer<typeof editProjectFormValuesSchema>;
