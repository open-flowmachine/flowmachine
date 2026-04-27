import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListAiAgentRunsQueryKey } from "@/lib/query/query-key";
import { makeAiAgentRunHttpClient } from "@/module/ai-agent-run/ai-agent-run-http-client";

type UseListAiAgentRunsOptions = Omit<
  UseQueryOptions<HttpEnvelope<AiAgentRun[]>, Error, AiAgentRun[]>,
  "queryKey" | "queryFn"
>;

export const useListAiAgentRuns = (
  aiAgentId: string,
  options?: UseListAiAgentRunsOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListAiAgentRunsQueryKey(aiAgentId),
    queryFn: () =>
      makeAiAgentRunHttpClient({ httpClient }).list({
        params: { aiAgentId },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
