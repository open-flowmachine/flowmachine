import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpClientDeleteGitRepositoryInput } from "@/module/git-repository/git-repository-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetGitRepositoryQueryKey,
  makeListGitRepositoriesQueryKey,
} from "@/lib/query/query-key";
import { makeGitRepositoryHttpClient } from "@/module/git-repository/git-repository-http-client";

type UseDeleteGitRepositoryOptions = Omit<
  UseMutationOptions<void, Error, HttpClientDeleteGitRepositoryInput, unknown>,
  "mutationFn"
>;

export const useDeleteGitRepository = (
  options?: UseDeleteGitRepositoryOptions,
) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientDeleteGitRepositoryInput) => {
      await makeGitRepositoryHttpClient({ httpClient }).deleteById(input);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      void queryClient.invalidateQueries({
        queryKey: makeListGitRepositoriesQueryKey(),
      });
      void queryClient.invalidateQueries({
        queryKey: makeGetGitRepositoryQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
