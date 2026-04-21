import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpClientUpdateGitRepositoryInput } from "@/module/git-repository/git-repository-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetGitRepositoryQueryKey,
  makeListGitRepositoriesQueryKey,
} from "@/lib/query/query-key";
import { makeGitRepositoryHttpClient } from "@/module/git-repository/git-repository-http-client";

type UseUpdateGitRepositoryOptions = Omit<
  UseMutationOptions<void, Error, HttpClientUpdateGitRepositoryInput, unknown>,
  "mutationFn"
>;

export const useUpdateGitRepository = (
  options?: UseUpdateGitRepositoryOptions,
) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientUpdateGitRepositoryInput) => {
      await makeGitRepositoryHttpClient({ httpClient }).updateById(input);
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
