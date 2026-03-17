import { format } from "date-fns";
import type { GitRepositoryDomain } from "@/core/domain/git-repository/entity";

type MakeGitRepositoryDomainServiceInput = {
  gitRepository: GitRepositoryDomain;
};

export const makeGitRepositoryDomainService = ({
  gitRepository,
}: MakeGitRepositoryDomainServiceInput) => ({
  getProviderDisplayName: () =>
    providerToDisplayName[gitRepository.integration.provider],
  getCreatedAt: () => format(gitRepository.createdAt, "MMM d, yyyy, h:mm a"),
  getUpdatedAt: () => format(gitRepository.updatedAt, "MMM d, yyyy, h:mm a"),
});

const providerToDisplayName = {
  github: "GitHub",
  gitlab: "GitLab",
} as const satisfies Record<
  GitRepositoryDomain["integration"]["provider"],
  string
>;
