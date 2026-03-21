import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetWorkflowDefinitionQueryKey,
  makeListWorkflowDefinitionsQueryKey,
} from "@/lib/query/query-key";
import { makeWorkflowDefinitionHttpClient } from "@/module/workflow/workflow-definition-http-client";
import type { HttpClientUpdateWorkflowDefinitionInput } from "@/module/workflow/workflow-definition-type";

type UseUpdateWorkflowDefinitionOptions = Omit<
  UseMutationOptions<
    void,
    Error,
    HttpClientUpdateWorkflowDefinitionInput,
    unknown
  >,
  "mutationFn"
>;

export const useUpdateWorkflowDefinition = (
  options?: UseUpdateWorkflowDefinitionOptions,
) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientUpdateWorkflowDefinitionInput) => {
      await makeWorkflowDefinitionHttpClient({ httpClient }).updateById(input);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({
        queryKey: makeListWorkflowDefinitionsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: makeGetWorkflowDefinitionQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
