import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateProject } from "@/action/project/update-project";
import type { UpdateProjectServicePortIn } from "@/core/port/project/service-port";
import { makeListProjectsQueryKey } from "@/presentation/lib/query/query-key";

type UseUpdateProjectOptions = Omit<
  UseMutationOptions<void, Error, UpdateProjectServicePortIn, unknown>,
  "mutationFn"
>;

export const useUpdateProject = (options?: UseUpdateProjectOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectServicePortIn) => {
      await updateProject(input);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: makeListProjectsQueryKey() });
      options?.onSuccess?.(...args);
    },
  });
};
