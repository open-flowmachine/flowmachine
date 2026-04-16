import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeGetAiAgentQueryKey } from "@/lib/query/query-key";
import { makeAiAgentHttpClient } from "@/module/ai-agent/ai-agent-http-client";

type UseGetAiAgentOptions = Omit<
  UseQueryOptions<HttpEnvelope<AiAgent>, Error, AiAgent>,
  "queryKey" | "queryFn"
>;

export const useGetAiAgent = (id: string, options?: UseGetAiAgentOptions) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeGetAiAgentQueryKey(id),
    queryFn: () =>
      makeAiAgentHttpClient({ httpClient }).getById({
        params: { id },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
