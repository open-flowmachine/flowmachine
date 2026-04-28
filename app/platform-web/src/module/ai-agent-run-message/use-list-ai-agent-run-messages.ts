import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListAiAgentRunMessagesQueryKey } from "@/lib/query/query-key";
import { makeAiAgentRunMessageHttpClient } from "@/module/ai-agent-run-message/ai-agent-run-message-http-client";

type UseListAiAgentRunMessagesOptions = Omit<
  UseQueryOptions<
    HttpEnvelope<AiAgentRunMessage[]>,
    Error,
    AiAgentRunMessage[]
  >,
  "queryKey" | "queryFn"
>;

export const useListAiAgentRunMessages = (
  aiAgentId: string,
  runId: string,
  options?: UseListAiAgentRunMessagesOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListAiAgentRunMessagesQueryKey(aiAgentId, runId),
    queryFn: () =>
      makeAiAgentRunMessageHttpClient({ httpClient }).list({
        params: { aiAgentId, runId },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
