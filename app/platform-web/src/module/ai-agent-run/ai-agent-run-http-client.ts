import type { HttpClient } from "@/lib/http/http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { Id } from "@/lib/schema";
import type {
  AiAgentRun,
  HttpClientCreateAiAgentRunInput,
  HttpClientGetAiAgentRunInput,
  HttpClientListAiAgentRunsInput,
  HttpClientStopAiAgentRunInput,
} from "@/module/ai-agent-run/ai-agent-run-type";

const basePath = (aiAgentId: Id) => `/api/v1/ai-agent/${aiAgentId}/run`;

const makeAiAgentRunHttpClient = (input: { httpClient: HttpClient }) => {
  const { httpClient } = input;

  return {
    create: async ({ params }: HttpClientCreateAiAgentRunInput) => {
      const response = await httpClient.post<HttpEnvelope<{ runId: Id }>>(
        basePath(params.aiAgentId),
        {},
      );
      return response.data;
    },

    list: async ({ params }: HttpClientListAiAgentRunsInput) => {
      const response = await httpClient.get<HttpEnvelope<AiAgentRun[]>>(
        basePath(params.aiAgentId),
      );
      return response.data;
    },

    getById: async ({ params }: HttpClientGetAiAgentRunInput) => {
      const response = await httpClient.get<HttpEnvelope<AiAgentRun>>(
        `${basePath(params.aiAgentId)}/${params.runId}`,
      );
      return response.data;
    },

    stop: async ({ params }: HttpClientStopAiAgentRunInput) => {
      const response = await httpClient.post<HttpEnvelope>(
        `${basePath(params.aiAgentId)}/${params.runId}/stop`,
      );
      return response.data;
    },
  };
};

export { makeAiAgentRunHttpClient };
