import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListGitRepositoriesQueryKey } from "@/lib/query/query-key";
import { makeGitRepositoryHttpClient } from "@/module/git-repository/git-repository-http-client";
import type { HttpClientCreateGitRepositoryInput } from "@/module/git-repository/git-repository-type";

type UseCreateGitRepositoryOptions = Omit<
  UseMutationOptions<void, Error, HttpClientCreateGitRepositoryInput, unknown>,
  "mutationFn"
>;

export const useCreateGitRepository = (
  options?: UseCreateGitRepositoryOptions,
) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientCreateGitRepositoryInput) => {
      await makeGitRepositoryHttpClient({ httpClient }).create(input);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: makeListGitRepositoriesQueryKey(),
      });
      options?.onSuccess?.(...args);
    },
  });
};
