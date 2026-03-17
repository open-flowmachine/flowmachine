import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteProject } from "@/action/project/delete-project";
import type { DeleteProjectServicePortIn } from "@/core/port/project/service-port";
import {
  makeGetProjectQueryKey,
  makeListProjectsQueryKey,
} from "@/presentation/lib/query/query-key";

type UseDeleteProjectOptions = Omit<
  UseMutationOptions<void, Error, DeleteProjectServicePortIn, unknown>,
  "mutationFn"
>;

export const useDeleteProject = (options?: UseDeleteProjectOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteProjectServicePortIn) => {
      await deleteProject(input.params.id);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: makeListProjectsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: makeGetProjectQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
