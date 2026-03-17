"use server";

import type { AiAgentDomain } from "@/core/domain/ai-agent/entity";
import { aiAgentDomainCodec } from "@/infra/http-client/ai-agent/ai-agent-codec";
import { makeAiAgentHttpClient } from "@/infra/http-client/ai-agent/ai-agent-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const listAiAgents = async (): Promise<AiAgentDomain[]> => {
  const httpClient = await makeServerHttpClient();
  const client = makeAiAgentHttpClient({ httpClient });
  const response = await client.list();
  return response.data.map((dto) => aiAgentDomainCodec.decode(dto));
};
