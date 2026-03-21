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
import type { HttpClientDeleteWorkflowDefinitionInput } from "@/module/workflow/workflow-definition-type";

type UseDeleteWorkflowDefinitionOptions = Omit<
  UseMutationOptions<
    void,
    Error,
    HttpClientDeleteWorkflowDefinitionInput,
    unknown
  >,
  "mutationFn"
>;

export const useDeleteWorkflowDefinition = (
  options?: UseDeleteWorkflowDefinitionOptions,
) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientDeleteWorkflowDefinitionInput) => {
      await makeWorkflowDefinitionHttpClient({ httpClient }).deleteById(input);
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
