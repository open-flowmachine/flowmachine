import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateAiAgent } from "@/action/ai-agent/update-ai-agent";
import type { UpdateAiAgentServicePortIn } from "@/core/port/ai-agent/service-port";
import { makeListAiAgentsQueryKey } from "@/presentation/lib/query/query-key";

type UseUpdateAiAgentOptions = Omit<
  UseMutationOptions<void, Error, UpdateAiAgentServicePortIn, unknown>,
  "mutationFn"
>;

export const useUpdateAiAgent = (options?: UseUpdateAiAgentOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAiAgentServicePortIn) => {
      await updateAiAgent(input);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: makeListAiAgentsQueryKey(),
      });
      options?.onSuccess?.(...args);
    },
  });
};
