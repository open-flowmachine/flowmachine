import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListAiAgentsQueryKey } from "@/lib/query/query-key";
import { makeAiAgentHttpClient } from "@/module/ai-agent/ai-agent-http-client";
import type { HttpClientAiAgentInput } from "@/module/ai-agent/ai-agent-type";

type UseUpdateAiAgentOptions = Omit<
  UseMutationOptions<void, Error, HttpClientAiAgentInput, unknown>,
  "mutationFn"
>;

export const useUpdateAiAgent = (options?: UseUpdateAiAgentOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientAiAgentInput) => {
      await makeAiAgentHttpClient({ httpClient }).updateById(input);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: makeListAiAgentsQueryKey() });
      options?.onSuccess?.(...args);
    },
  });
};
