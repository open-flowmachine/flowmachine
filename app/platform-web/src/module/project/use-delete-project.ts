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
import type { HttpClientDeleteProjectInput } from "@/module/project/project-type";

type UseDeleteProjectOptions = Omit<
  UseMutationOptions<void, Error, HttpClientDeleteProjectInput, unknown>,
  "mutationFn"
>;

export const useDeleteProject = (options?: UseDeleteProjectOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientDeleteProjectInput) => {
      await makeProjectHttpClient({ httpClient }).deleteById(input);
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
