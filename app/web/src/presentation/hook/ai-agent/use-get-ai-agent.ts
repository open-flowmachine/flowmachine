import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getAiAgent } from "@/action/ai-agent/get-ai-agent";
import type { AiAgentDomain } from "@/core/domain/ai-agent/entity";
import { makeGetAiAgentQueryKey } from "@/presentation/lib/query/query-key";

type UseGetAiAgentOptions = Omit<
  UseQueryOptions<AiAgentDomain, Error, AiAgentDomain>,
  "queryKey" | "queryFn"
>;

export const useGetAiAgent = (id: string, options?: UseGetAiAgentOptions) => {
  return useQuery({
    queryKey: makeGetAiAgentQueryKey(id),
    queryFn: () => getAiAgent(id),
    ...options,
  });
};
