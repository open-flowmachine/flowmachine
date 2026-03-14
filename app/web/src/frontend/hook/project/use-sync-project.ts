import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { SyncProjectServicePortIn } from "@/domain/port/project/project-service-port";
import { useProtectedHttpClient } from "@/frontend/hook/use-protected-http-client";
import { makeProjectHttpClient } from "@/frontend/http-client/project/project-http-client";
import {
  makeGetProjectQueryKey,
  makeListProjectsQueryKey,
} from "@/frontend/lib/query/query-key";

type UseSyncProjectOptions = Omit<
  UseMutationOptions<void, Error, SyncProjectServicePortIn, unknown>,
  "mutationFn"
>;

export const useSyncProject = (options?: UseSyncProjectOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SyncProjectServicePortIn) => {
      await makeProjectHttpClient({ httpClient }).syncById(input);
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
