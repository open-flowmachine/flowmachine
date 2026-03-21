import type { Id, Model } from "@/lib/schema";

const gitProviders = ["github", "gitlab"] as const;

type GitRepositoryConfig = {
  defaultBranch: string;
  email: string;
  username: string;
};

type GitRepositoryIntegration = {
  provider: (typeof gitProviders)[number];
  credentialId: string;
};

type GitRepositoryProject = {
  id: Id;
};

type GitRepository = Model<{
  name: string;
  url: string;
  config: GitRepositoryConfig;
  integration: GitRepositoryIntegration;
  projects: GitRepositoryProject[];
  tenant: { id: Id; type: "organization" | "user" };
}>;

type HttpClientCreateGitRepositoryInput = {
  body: {
    name: GitRepository["name"];
    url: GitRepository["url"];
    config: GitRepository["config"];
    integration: GitRepository["integration"];
    projects: GitRepository["projects"];
  };
};

type HttpClientDeleteGitRepositoryInput = {
  params: {
    id: Id;
  };
};

type HttpClientGetGitRepositoryInput = {
  params: {
    id: Id;
  };
};

type HttpClientUpdateGitRepositoryInput = {
  params: {
    id: Id;
  };
  body: {
    name?: GitRepository["name"];
    url?: GitRepository["url"];
    config?: GitRepository["config"];
    integration?: GitRepository["integration"];
    projects?: GitRepository["projects"];
  };
};

export { gitProviders };
export type {
  GitRepository,
  GitRepositoryConfig,
  GitRepositoryIntegration,
  GitRepositoryProject,
  HttpClientCreateGitRepositoryInput,
  HttpClientDeleteGitRepositoryInput,
  HttpClientGetGitRepositoryInput,
  HttpClientUpdateGitRepositoryInput,
};
