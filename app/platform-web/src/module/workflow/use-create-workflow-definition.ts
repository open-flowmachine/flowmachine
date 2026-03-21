import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListWorkflowDefinitionsQueryKey } from "@/lib/query/query-key";
import { makeWorkflowDefinitionHttpClient } from "@/module/workflow/workflow-definition-http-client";
import type { HttpClientCreateWorkflowDefinitionInput } from "@/module/workflow/workflow-definition-type";

type UseCreateWorkflowDefinitionOptions = Omit<
  UseMutationOptions<
    void,
    Error,
    HttpClientCreateWorkflowDefinitionInput,
    unknown
  >,
  "mutationFn"
>;

export const useCreateWorkflowDefinition = (
  options?: UseCreateWorkflowDefinitionOptions,
) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientCreateWorkflowDefinitionInput) => {
      await makeWorkflowDefinitionHttpClient({ httpClient }).create(input);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: makeListWorkflowDefinitionsQueryKey(),
      });
      options?.onSuccess?.(...args);
    },
  });
};
