import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { Id } from "@/lib/schema";
import type { HttpClientCreateAiAgentRunInput } from "@/module/ai-agent-run/ai-agent-run-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListAiAgentRunsQueryKey } from "@/lib/query/query-key";
import { makeAiAgentRunHttpClient } from "@/module/ai-agent-run/ai-agent-run-http-client";

type CreateAiAgentRunResult = HttpEnvelope<{ runId: Id }>;

type UseCreateAiAgentRunOptions = Omit<
  UseMutationOptions<
    CreateAiAgentRunResult,
    Error,
    HttpClientCreateAiAgentRunInput,
    unknown
  >,
  "mutationFn"
>;

export const useCreateAiAgentRun = (options?: UseCreateAiAgentRunOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HttpClientCreateAiAgentRunInput) =>
      makeAiAgentRunHttpClient({ httpClient }).create(input),
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      void queryClient.invalidateQueries({
        queryKey: makeListAiAgentRunsQueryKey(variables.params.aiAgentId),
      });
      options?.onSuccess?.(...args);
    },
  });
};
