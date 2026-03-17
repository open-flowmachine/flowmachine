"use server";

import type { CreateAiAgentServicePortIn } from "@/core/port/ai-agent/service-port";
import { makeAiAgentHttpClient } from "@/infra/http-client/ai-agent/ai-agent-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const createAiAgent = async (
  input: CreateAiAgentServicePortIn["body"],
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeAiAgentHttpClient({ httpClient });
  await client.create({ payload: input });
};
