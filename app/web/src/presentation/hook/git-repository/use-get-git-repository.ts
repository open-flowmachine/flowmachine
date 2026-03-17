import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getGitRepository } from "@/action/git-repository/get-git-repository";
import type { GitRepositoryDomain } from "@/core/domain/git-repository/entity";
import { makeGetGitRepositoryQueryKey } from "@/presentation/lib/query/query-key";

type UseGetGitRepositoryOptions = Omit<
  UseQueryOptions<GitRepositoryDomain, Error, GitRepositoryDomain>,
  "queryKey" | "queryFn"
>;

export const useGetGitRepository = (
  id: string,
  options?: UseGetGitRepositoryOptions,
) => {
  return useQuery({
    queryKey: makeGetGitRepositoryQueryKey(id),
    queryFn: () => getGitRepository(id),
    ...options,
  });
};
