"use server";

import type { CreateWorkflowDefinitionServicePortIn } from "@/core/port/workflow-definition/service-port";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";
import { makeWorkflowDefinitionHttpClient } from "@/infra/http-client/workflow-definition/workflow-definition-http-client";

export const createWorkflowDefinition = async (
  input: CreateWorkflowDefinitionServicePortIn["body"],
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeWorkflowDefinitionHttpClient({ httpClient });
  await client.create({ payload: input });
};
