"use server";

import type { UpdateAiAgentServicePortIn } from "@/core/port/ai-agent/service-port";
import { makeAiAgentHttpClient } from "@/infra/http-client/ai-agent/ai-agent-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const updateAiAgent = async (
  input: UpdateAiAgentServicePortIn,
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeAiAgentHttpClient({ httpClient });
  await client.updateById({
    payload: { id: input.params.id, body: input.body },
  });
};
