import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const gitProviders = ["github", "gitlab"] as const;
type GitProvider = (typeof gitProviders)[number];

type GitRepository = Model<{
  name: string;
  url: string;
  config: {
    defaultBranch: string;
    email: string;
    username: string;
  };
  integration: {
    provider: GitProvider;
    credentialId: Id;
  };
  projects: Array<{
    id: Id;
  }>;
}>;

export { gitProviders };
export type { GitRepository, GitProvider };
