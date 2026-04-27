import type { HttpClient } from "@/lib/http/http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { Id } from "@/lib/schema";
import type {
  AiAgentRunMessage,
  HttpClientListAiAgentRunMessagesInput,
  HttpClientSendAiAgentRunMessageInput,
} from "@/module/ai-agent-run-message/ai-agent-run-message-type";

const basePath = (aiAgentId: Id, runId: Id) =>
  `/api/v1/ai-agent/${aiAgentId}/run/${runId}/message`;

const makeAiAgentRunMessageHttpClient = (input: { httpClient: HttpClient }) => {
  const { httpClient } = input;

  return {
    list: async ({ params }: HttpClientListAiAgentRunMessagesInput) => {
      const response = await httpClient.get<HttpEnvelope<AiAgentRunMessage[]>>(
        basePath(params.aiAgentId, params.runId),
      );
      return response.data;
    },

    send: async ({ params, body }: HttpClientSendAiAgentRunMessageInput) => {
      const response = await httpClient.post<
        HttpEnvelope<{ messageId: Id }>
      >(basePath(params.aiAgentId, params.runId), body);
      return response.data;
    },
  };
};

export { makeAiAgentRunMessageHttpClient };
