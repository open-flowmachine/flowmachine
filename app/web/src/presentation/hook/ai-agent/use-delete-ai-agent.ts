import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteAiAgent } from "@/action/ai-agent/delete-ai-agent";
import type { DeleteAiAgentServicePortIn } from "@/core/port/ai-agent/service-port";
import {
  makeGetAiAgentQueryKey,
  makeListAiAgentsQueryKey,
} from "@/presentation/lib/query/query-key";

type UseDeleteAiAgentOptions = Omit<
  UseMutationOptions<void, Error, DeleteAiAgentServicePortIn, unknown>,
  "mutationFn"
>;

export const useDeleteAiAgent = (options?: UseDeleteAiAgentOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteAiAgentServicePortIn) => {
      await deleteAiAgent(input.params.id);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({
        queryKey: makeListAiAgentsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: makeGetAiAgentQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
