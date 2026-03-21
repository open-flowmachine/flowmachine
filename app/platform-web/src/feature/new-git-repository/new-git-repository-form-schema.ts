import { z } from "zod/v4";
import { idSchema } from "@/lib/schema";
import { gitProviders } from "@/module/git-repository/git-repository-type";

export const newGitRepositoryFormValuesSchema = z.object({
  name: z.string(),
  url: z.string(),
  config: z.object({
    defaultBranch: z.string(),
    email: z.string(),
    username: z.string(),
  }),
  integration: z.object({
    provider: z.enum(gitProviders),
    credentialId: z.string(),
  }),
  projects: z.array(idSchema),
});

export type NewGitRepositoryFormValues = z.infer<
  typeof newGitRepositoryFormValuesSchema
>;
