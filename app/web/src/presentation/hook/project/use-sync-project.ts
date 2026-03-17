import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { syncProject } from "@/action/project/sync-project";
import type { SyncProjectServicePortIn } from "@/core/port/project/service-port";
import {
  makeGetProjectQueryKey,
  makeListProjectsQueryKey,
} from "@/presentation/lib/query/query-key";

type UseSyncProjectOptions = Omit<
  UseMutationOptions<void, Error, SyncProjectServicePortIn, unknown>,
  "mutationFn"
>;

export const useSyncProject = (options?: UseSyncProjectOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SyncProjectServicePortIn) => {
      await syncProject(input.params.id);
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
