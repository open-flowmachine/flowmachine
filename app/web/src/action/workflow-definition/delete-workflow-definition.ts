"use server";

import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";
import { makeWorkflowDefinitionHttpClient } from "@/infra/http-client/workflow-definition/workflow-definition-http-client";

export const deleteWorkflowDefinition = async (id: string): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeWorkflowDefinitionHttpClient({ httpClient });
  await client.deleteById({ payload: { id } });
};
