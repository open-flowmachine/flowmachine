import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createWorkflowDefinition } from "@/action/workflow-definition/create-workflow-definition";
import type { CreateWorkflowDefinitionServicePortIn } from "@/core/port/workflow-definition/service-port";
import { makeListWorkflowDefinitionsQueryKey } from "@/presentation/lib/query/query-key";

type UseCreateWorkflowDefinitionOptions = Omit<
  UseMutationOptions<
    void,
    Error,
    CreateWorkflowDefinitionServicePortIn,
    unknown
  >,
  "mutationFn"
>;

export const useCreateWorkflowDefinition = (
  options?: UseCreateWorkflowDefinitionOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWorkflowDefinitionServicePortIn) => {
      await createWorkflowDefinition(input.body);
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
