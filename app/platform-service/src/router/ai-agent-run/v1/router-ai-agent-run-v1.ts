import Elysia from "elysia";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type { AiAgentRunResponseDto } from "@/router/ai-agent-run/v1/router-ai-agent-run-v1-dto";

import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import {
  getAiAgentRunRequestParamsDtoSchema,
  listAiAgentRunsRequestParamsDtoSchema,
} from "@/router/ai-agent-run/v1/router-ai-agent-run-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const aiAgentRunService = makeAiAgentRunService();

const toDto = (aiAgentRun: AiAgentRun) =>
  ({
    id: aiAgentRun.id,
    createdAt: aiAgentRun.createdAt,
    updatedAt: aiAgentRun.updatedAt,
    aiAgentId: aiAgentRun.aiAgentId,
    sandbox: aiAgentRun.sandbox,
    sessionId: aiAgentRun.sessionId,
    status: aiAgentRun.status,
  }) satisfies AiAgentRunResponseDto;

const aiAgentRunV1Router = new Elysia({ name: "aiAgentRunV1HttpRouter" })
  .use(routerAuthGuard)
  .group("/api/v1/ai-agent/:aiAgentId/run", (r) =>
    r
      .get(
        "",
        async ({ tenant, params }) => {
          const result = await aiAgentRunService.list({
            ctx: { tenant },
            filter: { aiAgentId: params.aiAgentId },
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: result.value.data.map(toDto) });
        },
        { params: listAiAgentRunsRequestParamsDtoSchema },
      )
      .get(
        "/:aiAgentRunId",
        async ({ tenant, params }) => {
          const result = await aiAgentRunService.get({
            ctx: { tenant },
            id: params.aiAgentRunId,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        { params: getAiAgentRunRequestParamsDtoSchema },
      ),
  );

export { aiAgentRunV1Router };
