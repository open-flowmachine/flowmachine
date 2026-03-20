import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const projectProviders = ["jira", "linear"] as const;
type ProjectProvider = (typeof projectProviders)[number];

type Project = Model<{
  name: string;
  integration: {
    domain: string;
    externalId: string;
    externalKey: string;
    provider: ProjectProvider;
    webhookSecret: string;
    credentialId: Id;
  } | null;
}>;

export { projectProviders };
export type { Project, ProjectProvider };
