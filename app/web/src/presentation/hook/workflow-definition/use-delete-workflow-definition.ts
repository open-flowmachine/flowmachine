import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteWorkflowDefinition } from "@/action/workflow-definition/delete-workflow-definition";
import type { DeleteWorkflowDefinitionServicePortIn } from "@/core/port/workflow-definition/service-port";
import {
  makeGetWorkflowDefinitionQueryKey,
  makeListWorkflowDefinitionsQueryKey,
} from "@/presentation/lib/query/query-key";

type UseDeleteWorkflowDefinitionOptions = Omit<
  UseMutationOptions<
    void,
    Error,
    DeleteWorkflowDefinitionServicePortIn,
    unknown
  >,
  "mutationFn"
>;

export const useDeleteWorkflowDefinition = (
  options?: UseDeleteWorkflowDefinitionOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteWorkflowDefinitionServicePortIn) => {
      await deleteWorkflowDefinition(input.params.id);
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
