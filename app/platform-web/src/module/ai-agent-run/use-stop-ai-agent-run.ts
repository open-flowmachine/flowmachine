import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpClientStopAiAgentRunInput } from "@/module/ai-agent-run/ai-agent-run-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetAiAgentRunQueryKey,
  makeListAiAgentRunsQueryKey,
} from "@/lib/query/query-key";
import { makeAiAgentRunHttpClient } from "@/module/ai-agent-run/ai-agent-run-http-client";

type UseStopAiAgentRunOptions = Omit<
  UseMutationOptions<void, Error, HttpClientStopAiAgentRunInput, unknown>,
  "mutationFn"
>;

export const useStopAiAgentRun = (options?: UseStopAiAgentRunOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientStopAiAgentRunInput) => {
      await makeAiAgentRunHttpClient({ httpClient }).stop(input);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      void queryClient.invalidateQueries({
        queryKey: makeGetAiAgentRunQueryKey(
          variables.params.aiAgentId,
          variables.params.runId,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: makeListAiAgentRunsQueryKey(variables.params.aiAgentId),
      });
      options?.onSuccess?.(...args);
    },
  });
};
