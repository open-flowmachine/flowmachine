import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createProject } from "@/action/project/create-project";
import type { CreateProjectServicePortIn } from "@/core/port/project/service-port";
import { makeListProjectsQueryKey } from "@/presentation/lib/query/query-key";

type UseCreateProjectOptions = Omit<
  UseMutationOptions<void, Error, CreateProjectServicePortIn, unknown>,
  "mutationFn"
>;

export const useCreateProject = (options?: UseCreateProjectOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectServicePortIn) => {
      await createProject(input.body);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: makeListProjectsQueryKey() });
      options?.onSuccess?.(...args);
    },
  });
};
