import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeGetAiAgentRunQueryKey } from "@/lib/query/query-key";
import { makeAiAgentRunHttpClient } from "@/module/ai-agent-run/ai-agent-run-http-client";

type UseGetAiAgentRunOptions = Omit<
  UseQueryOptions<HttpEnvelope<AiAgentRun>, Error, AiAgentRun>,
  "queryKey" | "queryFn"
>;

export const useGetAiAgentRun = (
  aiAgentId: string,
  runId: string,
  options?: UseGetAiAgentRunOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeGetAiAgentRunQueryKey(aiAgentId, runId),
    queryFn: () =>
      makeAiAgentRunHttpClient({ httpClient }).getById({
        params: { aiAgentId, runId },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
