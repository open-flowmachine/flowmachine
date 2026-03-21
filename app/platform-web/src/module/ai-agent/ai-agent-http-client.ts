import type { HttpClient } from "@/lib/http/http-client";
import { type HttpEnvelope } from "@/lib/http/http-schema";
import type {
  AiAgent,
  HttpClientAiAgentInput,
  HttpClientCreateAiAgentInput,
  HttpClientDeleteAiAgentInput,
  HttpClientGetAiAgentInput,
} from "@/module/ai-agent/ai-agent-type";

const BASE_PATH = "/api/v1/ai-agent";

const makeAiAgentHttpClient = (input: { httpClient: HttpClient }) => {
  const { httpClient } = input;

  return {
    create: async ({ body }: HttpClientCreateAiAgentInput) => {
      const response = await httpClient.post<HttpEnvelope>(BASE_PATH, body);
      return response.data;
    },

    deleteById: async ({ params }: HttpClientDeleteAiAgentInput) => {
      const response = await httpClient.delete<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    getById: async ({ params }: HttpClientGetAiAgentInput) => {
      const response = await httpClient.get<HttpEnvelope<AiAgent>>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    list: async () => {
      const response = await httpClient.get<HttpEnvelope<AiAgent[]>>(BASE_PATH);
      return response.data;
    },

    updateById: async ({ body, params }: HttpClientAiAgentInput) => {
      const response = await httpClient.patch<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
        body,
      );
      return response.data;
    },
  };
};

export { makeAiAgentHttpClient };
