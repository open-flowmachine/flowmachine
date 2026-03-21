import type { HttpClient } from "@/lib/http/http-client";
import { type HttpEnvelope } from "@/lib/http/http-schema";
import type {
  HttpClientCreateWorkflowDefinitionInput,
  HttpClientDeleteWorkflowDefinitionInput,
  HttpClientGetWorkflowDefinitionInput,
  HttpClientUpdateWorkflowDefinitionInput,
  WorkflowDefinition,
} from "@/module/workflow/workflow-definition-type";

const BASE_PATH = "/api/v1/workflow-definition";

const makeWorkflowDefinitionHttpClient = (input: {
  httpClient: HttpClient;
}) => {
  const { httpClient } = input;

  return {
    create: async ({ body }: HttpClientCreateWorkflowDefinitionInput) => {
      const response = await httpClient.post<HttpEnvelope<WorkflowDefinition>>(
        BASE_PATH,
        body,
      );
      return response.data;
    },

    deleteById: async ({ params }: HttpClientDeleteWorkflowDefinitionInput) => {
      const response = await httpClient.delete<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    getById: async ({ params }: HttpClientGetWorkflowDefinitionInput) => {
      const response = await httpClient.get<HttpEnvelope<WorkflowDefinition>>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    list: async () => {
      const response =
        await httpClient.get<HttpEnvelope<WorkflowDefinition[]>>(BASE_PATH);
      return response.data;
    },

    updateById: async ({
      body,
      params,
    }: HttpClientUpdateWorkflowDefinitionInput) => {
      const response = await httpClient.patch<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
        body,
      );
      return response.data;
    },
  };
};

export { makeWorkflowDefinitionHttpClient };
