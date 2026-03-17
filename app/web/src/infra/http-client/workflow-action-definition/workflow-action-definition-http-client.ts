import type { HttpClient } from "@/core/http/http-client";
import { withHttpEnvelopeSchema } from "@/infra/http-client/shared/http-envelope-schema";
import { workflowActionDefinitionHttpResponseDtoSchema } from "@/infra/http-client/workflow-action-definition/workflow-action-definition-http-client-dto";

const BASE_PATH = "/api/v1/workflow-action-definition";

type MakeWorkflowActionDefinitionHttpClientIn = {
  httpClient: HttpClient;
};

export const makeWorkflowActionDefinitionHttpClient = ({
  httpClient,
}: MakeWorkflowActionDefinitionHttpClientIn) => ({
  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(
      workflowActionDefinitionHttpResponseDtoSchema.array(),
    );
    return schema.parse(response.data);
  },
});

export type WorkflowActionDefinitionHttpClient = ReturnType<
  typeof makeWorkflowActionDefinitionHttpClient
>;
