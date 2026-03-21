import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeListAiAgentsQueryKey } from "@/lib/query/query-key";
import { makeAiAgentHttpClient } from "@/module/ai-agent/ai-agent-http-client";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

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
