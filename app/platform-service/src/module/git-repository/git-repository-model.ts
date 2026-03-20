import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const gitProviders = ["github", "gitlab"] as const;
type GitProvider = (typeof gitProviders)[number];

const gitRepositorySyncStatuses = ["idle", "pending", "success", "error"] as const;
type GitRepositorySyncStatus = (typeof gitRepositorySyncStatuses)[number];

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
    syncStatus: GitRepositorySyncStatus;
    syncedAt: Date | null;
  }>;
}>;

export { gitProviders, gitRepositorySyncStatuses };
export type { GitRepository, GitProvider, GitRepositorySyncStatus };
