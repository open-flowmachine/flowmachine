import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createAiAgent } from "@/action/ai-agent/create-ai-agent";
import type { CreateAiAgentServicePortIn } from "@/core/port/ai-agent/service-port";
import { makeListAiAgentsQueryKey } from "@/presentation/lib/query/query-key";

type UseCreateAiAgentOptions = Omit<
  UseMutationOptions<void, Error, CreateAiAgentServicePortIn, unknown>,
  "mutationFn"
>;

export const useCreateAiAgent = (options?: UseCreateAiAgentOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAiAgentServicePortIn) => {
      await createAiAgent(input.body);
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
