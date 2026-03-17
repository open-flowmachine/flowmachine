import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteGitRepository } from "@/action/git-repository/delete-git-repository";
import type { DeleteGitRepositoryServicePortIn } from "@/core/port/git-repository/service-port";
import {
  makeGetGitRepositoryQueryKey,
  makeListGitRepositoriesQueryKey,
} from "@/presentation/lib/query/query-key";

type UseDeleteGitRepositoryOptions = Omit<
  UseMutationOptions<void, Error, DeleteGitRepositoryServicePortIn, unknown>,
  "mutationFn"
>;

export const useDeleteGitRepository = (
  options?: UseDeleteGitRepositoryOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteGitRepositoryServicePortIn) => {
      await deleteGitRepository(input.params.id);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({
        queryKey: makeListGitRepositoriesQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: makeGetGitRepositoryQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
