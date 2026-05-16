import Elysia from "elysia";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type { AiAgentRunMessageResponseDto } from "@/router/ai-agent-run-message/v1/router-ai-agent-run-message-v1-dto";

import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import {
  listAiAgentRunMessagesRequestParamsDtoSchema,
  postAiAgentRunMessageRequestBodyDtoSchema,
} from "@/router/ai-agent-run-message/v1/router-ai-agent-run-message-v1-dto";
import { routerProtectedSetup } from "@/router/router-plugin";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const aiAgentRunMessageService = makeAiAgentRunMessageService();

const toDto = (message: AiAgentRunMessage) =>
  ({
    id: message.id,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    aiAgentRunId: message.aiAgentRunId,
    role: message.role,
    content: message.content,
    toolName: message.toolName,
    toolInput: message.toolInput,
    toolResult: message.toolResult,
  }) satisfies AiAgentRunMessageResponseDto;

const aiAgentRunMessageV1Router = new Elysia({
  name: "aiAgentRunMessageV1HttpRouter",
})
  .use(routerProtectedSetup)
  .group("/api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId/message", (r) =>
    r
      .post(
        "",
        async ({ body, tenant, params }) => {
          const payload = {
            role: body.role,
            content: body.content,
            toolName: body.toolName ?? null,
            toolInput: body.toolInput ?? null,
            toolResult: body.toolResult ?? null,
            aiAgentRunId: params.aiAgentRunId,
          };
          const result = await aiAgentRunMessageService.create({
            ctx: { tenant },
            payload,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        { body: postAiAgentRunMessageRequestBodyDtoSchema },
      )
      .get(
        "",
        async ({ tenant, params }) => {
          const result = await aiAgentRunMessageService.list({
            ctx: { tenant },
            filter: { aiAgentRunId: params.aiAgentRunId },
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: result.value.data.map(toDto) });
        },
        { params: listAiAgentRunMessagesRequestParamsDtoSchema },
      ),
  );

export { aiAgentRunMessageV1Router };
