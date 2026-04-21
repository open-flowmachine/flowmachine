import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpClientCreateAiAgentInput } from "@/module/ai-agent/ai-agent-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListAiAgentsQueryKey } from "@/lib/query/query-key";
import { makeAiAgentHttpClient } from "@/module/ai-agent/ai-agent-http-client";

type UseCreateAiAgentOptions = Omit<
  UseMutationOptions<void, Error, HttpClientCreateAiAgentInput, unknown>,
  "mutationFn"
>;

export const useCreateAiAgent = (options?: UseCreateAiAgentOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientCreateAiAgentInput) => {
      await makeAiAgentHttpClient({ httpClient }).create(input);
    },
    ...options,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: makeListAiAgentsQueryKey() });
      options?.onSuccess?.(...args);
    },
  });
};
