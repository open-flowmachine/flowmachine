import { format } from "date-fns";
import type { GitRepository } from "@/module/git-repository/git-repository-type";

const providerToDisplayName = {
  github: "GitHub",
  gitlab: "GitLab",
} as const satisfies Record<
  GitRepository["integration"]["provider"],
  string
>;

const makeGitRepositoryService = (input: {
  gitRepository: GitRepository;
}) => {
  const { gitRepository } = input;
  return {
    getProviderDisplayName: () =>
      providerToDisplayName[gitRepository.integration.provider],
    getCreatedAt: () =>
      format(gitRepository.createdAt, "MMM d, yyyy, h:mm a"),
    getUpdatedAt: () =>
      format(gitRepository.updatedAt, "MMM d, yyyy, h:mm a"),
  };
};

export { makeGitRepositoryService };
