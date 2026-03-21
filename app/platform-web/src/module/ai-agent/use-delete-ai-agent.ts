import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetAiAgentQueryKey,
  makeListAiAgentsQueryKey,
} from "@/lib/query/query-key";
import { makeAiAgentHttpClient } from "@/module/ai-agent/ai-agent-http-client";
import type { HttpClientDeleteAiAgentInput } from "@/module/ai-agent/ai-agent-type";

type UseDeleteAiAgentOptions = Omit<
  UseMutationOptions<void, Error, HttpClientDeleteAiAgentInput, unknown>,
  "mutationFn"
>;

export const useDeleteAiAgent = (options?: UseDeleteAiAgentOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientDeleteAiAgentInput) => {
      await makeAiAgentHttpClient({ httpClient }).deleteById(input);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: makeListAiAgentsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: makeGetAiAgentQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
