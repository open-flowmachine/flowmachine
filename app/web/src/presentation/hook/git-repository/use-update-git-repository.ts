import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateGitRepository } from "@/action/git-repository/update-git-repository";
import type { UpdateGitRepositoryServicePortIn } from "@/core/port/git-repository/service-port";
import {
  makeGetGitRepositoryQueryKey,
  makeListGitRepositoriesQueryKey,
} from "@/presentation/lib/query/query-key";

type UseUpdateGitRepositoryOptions = Omit<
  UseMutationOptions<void, Error, UpdateGitRepositoryServicePortIn, unknown>,
  "mutationFn"
>;

export const useUpdateGitRepository = (
  options?: UseUpdateGitRepositoryOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateGitRepositoryServicePortIn) => {
      await updateGitRepository(input);
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
