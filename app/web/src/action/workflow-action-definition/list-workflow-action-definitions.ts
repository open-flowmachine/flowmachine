"use server";

import type { WorkflowActionDefinitionDomain } from "@/core/domain/workflow-action-definition/entity";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";
import { workflowActionDefinitionDomainCodec } from "@/infra/http-client/workflow-action-definition/workflow-action-definition-codec";
import { makeWorkflowActionDefinitionHttpClient } from "@/infra/http-client/workflow-action-definition/workflow-action-definition-http-client";

export const listWorkflowActionDefinitions = async (): Promise<
  WorkflowActionDefinitionDomain[]
> => {
  const httpClient = await makeServerHttpClient();
  const client = makeWorkflowActionDefinitionHttpClient({ httpClient });
  const response = await client.list();
  return response.data.map((dto) =>
    workflowActionDefinitionDomainCodec.decode(dto),
  );
};
