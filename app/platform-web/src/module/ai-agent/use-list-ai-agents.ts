import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListAiAgentsQueryKey } from "@/lib/query/query-key";
import { makeAiAgentHttpClient } from "@/module/ai-agent/ai-agent-http-client";

type UseListAiAgentsOptions = Omit<
  UseQueryOptions<HttpEnvelope<AiAgent[]>, Error, AiAgent[]>,
  "queryKey" | "queryFn"
>;

export const useListAiAgents = (options?: UseListAiAgentsOptions) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListAiAgentsQueryKey(),
    queryFn: () => makeAiAgentHttpClient({ httpClient }).list(),
    select: (envelope) => envelope.data,
    ...options,
  });
};
