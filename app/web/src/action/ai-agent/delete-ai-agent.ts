"use server";

import { makeAiAgentHttpClient } from "@/infra/http-client/ai-agent/ai-agent-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const deleteAiAgent = async (id: string): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeAiAgentHttpClient({ httpClient });
  await client.deleteById({ payload: { id } });
};
