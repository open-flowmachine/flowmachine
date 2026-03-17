"use server";

import type { WorkflowDefinitionDomain } from "@/core/domain/workflow-definition/entity";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";
import { workflowDefinitionDomainCodec } from "@/infra/http-client/workflow-definition/workflow-definition-codec";
import { makeWorkflowDefinitionHttpClient } from "@/infra/http-client/workflow-definition/workflow-definition-http-client";

export const listWorkflowDefinitions = async (): Promise<
  WorkflowDefinitionDomain[]
> => {
  const httpClient = await makeServerHttpClient();
  const client = makeWorkflowDefinitionHttpClient({ httpClient });
  const response = await client.list();
  return response.data.map((dto) => workflowDefinitionDomainCodec.decode(dto));
};
