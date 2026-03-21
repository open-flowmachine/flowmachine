import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeListGitRepositoriesQueryKey } from "@/lib/query/query-key";
import { makeGitRepositoryHttpClient } from "@/module/git-repository/git-repository-http-client";
import type { GitRepository } from "@/module/git-repository/git-repository-type";

type UseListGitRepositoriesOptions = Omit<
  UseQueryOptions<HttpEnvelope<GitRepository[]>, Error, GitRepository[]>,
  "queryKey" | "queryFn"
>;

export const useListGitRepositories = (
  options?: UseListGitRepositoriesOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListGitRepositoriesQueryKey(),
    queryFn: () => makeGitRepositoryHttpClient({ httpClient }).list(),
    select: (envelope) => envelope.data,
    ...options,
  });
};
