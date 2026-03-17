import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { listGitRepositories } from "@/action/git-repository/list-git-repositories";
import type { GitRepositoryDomain } from "@/core/domain/git-repository/entity";
import { makeListGitRepositoriesQueryKey } from "@/presentation/lib/query/query-key";

type UseListGitRepositoriesOptions = Omit<
  UseQueryOptions<GitRepositoryDomain[], Error, GitRepositoryDomain[]>,
  "queryKey" | "queryFn"
>;

export const useListGitRepositories = (
  options?: UseListGitRepositoriesOptions,
) => {
  return useQuery({
    queryKey: makeListGitRepositoriesQueryKey(),
    queryFn: () => listGitRepositories(),
    ...options,
  });
};
