import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createGitRepository } from "@/action/git-repository/create-git-repository";
import type { CreateGitRepositoryServicePortIn } from "@/core/port/git-repository/service-port";
import { makeListGitRepositoriesQueryKey } from "@/presentation/lib/query/query-key";

type UseCreateGitRepositoryOptions = Omit<
  UseMutationOptions<void, Error, CreateGitRepositoryServicePortIn, unknown>,
  "mutationFn"
>;

export const useCreateGitRepository = (
  options?: UseCreateGitRepositoryOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGitRepositoryServicePortIn) => {
      await createGitRepository(input.body);
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
