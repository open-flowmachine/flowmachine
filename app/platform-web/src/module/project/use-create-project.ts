import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpClientCreateProjectInput } from "@/module/project/project-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListProjectsQueryKey } from "@/lib/query/query-key";
import { makeProjectHttpClient } from "@/module/project/project-http-client";

type UseCreateProjectOptions = Omit<
  UseMutationOptions<void, Error, HttpClientCreateProjectInput, unknown>,
  "mutationFn"
>;

export const useCreateProject = (options?: UseCreateProjectOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientCreateProjectInput) => {
      await makeProjectHttpClient({ httpClient }).create(input);
    },
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({
        queryKey: makeListProjectsQueryKey(),
      });
      options?.onSuccess?.(...args);
    },
  });
};
