import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeGetGitRepositoryQueryKey } from "@/lib/query/query-key";
import { makeGitRepositoryHttpClient } from "@/module/git-repository/git-repository-http-client";
import type { GitRepository } from "@/module/git-repository/git-repository-type";

type UseGetGitRepositoryOptions = Omit<
  UseQueryOptions<HttpEnvelope<GitRepository>, Error, GitRepository>,
  "queryKey" | "queryFn"
>;

export const useGetGitRepository = (
  id: string,
  options?: UseGetGitRepositoryOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeGetGitRepositoryQueryKey(id),
    queryFn: () =>
      makeGitRepositoryHttpClient({ httpClient }).getById({
        params: { id },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
