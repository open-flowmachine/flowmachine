import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpClientUpdateProjectInput } from "@/module/project/project-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListProjectsQueryKey } from "@/lib/query/query-key";
import { makeProjectHttpClient } from "@/module/project/project-http-client";

type UseUpdateProjectOptions = Omit<
  UseMutationOptions<void, Error, HttpClientUpdateProjectInput, unknown>,
  "mutationFn"
>;

export const useUpdateProject = (options?: UseUpdateProjectOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientUpdateProjectInput) => {
      await makeProjectHttpClient({ httpClient }).updateById(input);
    },
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: makeListProjectsQueryKey() });
      options?.onSuccess?.(...args);
    },
  });
};
