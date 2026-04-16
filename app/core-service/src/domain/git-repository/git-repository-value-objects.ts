import type { CredentialId } from "@/domain/credential/credential-id";

const gitProviders = ["github", "gitlab"] as const;
type GitProvider = (typeof gitProviders)[number];

type GitRepositoryConfig = {
  readonly defaultBranch: string;
  readonly email: string;
  readonly username: string;
};

type GitRepositoryIntegration = {
  readonly provider: GitProvider;
  readonly credentialId: CredentialId;
};

export { gitProviders };
export type { GitProvider, GitRepositoryConfig, GitRepositoryIntegration };
