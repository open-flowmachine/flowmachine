import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetProjectQueryKey,
  makeListProjectsQueryKey,
} from "@/lib/query/query-key";
import { makeProjectHttpClient } from "@/module/project/project-http-client";
import type { HttpClientSyncProjectInput } from "@/module/project/project-type";

type UseSyncProjectOptions = Omit<
  UseMutationOptions<void, Error, HttpClientSyncProjectInput, unknown>,
  "mutationFn"
>;

export const useSyncProject = (options?: UseSyncProjectOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientSyncProjectInput) => {
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
