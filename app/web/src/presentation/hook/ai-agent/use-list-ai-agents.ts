import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { listAiAgents } from "@/action/ai-agent/list-ai-agents";
import type { AiAgentDomain } from "@/core/domain/ai-agent/entity";
import { makeListAiAgentsQueryKey } from "@/presentation/lib/query/query-key";

type UseListAiAgentsOptions = Omit<
  UseQueryOptions<AiAgentDomain[], Error, AiAgentDomain[]>,
  "queryKey" | "queryFn"
>;

export const useListAiAgents = (options?: UseListAiAgentsOptions) => {
  return useQuery({
    queryKey: makeListAiAgentsQueryKey(),
    queryFn: () => listAiAgents(),
    ...options,
  });
};
