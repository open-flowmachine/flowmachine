import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateWorkflowDefinition } from "@/action/workflow-definition/update-workflow-definition";
import type { UpdateWorkflowDefinitionServicePortIn } from "@/core/port/workflow-definition/service-port";
import {
  makeGetWorkflowDefinitionQueryKey,
  makeListWorkflowDefinitionsQueryKey,
} from "@/presentation/lib/query/query-key";

type UseUpdateWorkflowDefinitionOptions = Omit<
  UseMutationOptions<
    void,
    Error,
    UpdateWorkflowDefinitionServicePortIn,
    unknown
  >,
  "mutationFn"
>;

export const useUpdateWorkflowDefinition = (
  options?: UseUpdateWorkflowDefinitionOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateWorkflowDefinitionServicePortIn) => {
      await updateWorkflowDefinition(input);
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
