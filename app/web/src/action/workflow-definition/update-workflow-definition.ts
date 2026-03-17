"use server";

import type { UpdateWorkflowDefinitionServicePortIn } from "@/core/port/workflow-definition/service-port";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";
import { makeWorkflowDefinitionHttpClient } from "@/infra/http-client/workflow-definition/workflow-definition-http-client";

export const updateWorkflowDefinition = async (
  input: UpdateWorkflowDefinitionServicePortIn,
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeWorkflowDefinitionHttpClient({ httpClient });
  await client.updateById({
    payload: { id: input.params.id, body: input.body },
  });
};
