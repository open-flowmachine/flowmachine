import Elysia from "elysia";
import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import {
  createAiAgent,
  deleteAiAgent,
  getAiAgent,
  listAiAgents,
  updateAiAgent,
} from "@/module/ai-agent/ai-agent-service";
import type { AiAgentResponseDto } from "@/router/ai-agent/v1/router-ai-agent-v1-dto";
import {
  deleteAiAgentRequestParamsDtoSchema,
  patchAiAgentRequestBodyDtoSchema,
  patchAiAgentRequestParamsDtoSchema,
  postAiAgentRequestBodyDtoSchema,
} from "@/router/ai-agent/v1/router-ai-agent-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const toDto = (aiAgent: AiAgent) =>
  ({
    id: aiAgent.id,
    createdAt: aiAgent.createdAt,
    updatedAt: aiAgent.updatedAt,
    name: aiAgent.name,
    model: aiAgent.model,
    projects: aiAgent.projects,
  }) satisfies AiAgentResponseDto;

const aiAgentV1Router = new Elysia({ name: "aiAgentV1HttpRouter" })
  .use(routerAuthGuard)
  .group("/api/v1/ai-agent", (r) =>
    r
      .post(
        "",
        async ({ body, tenant }) => {
          const result = await createAiAgent({
            ctx: { tenant },
            payload: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: { id: result.value.id } });
        },
        {
          body: postAiAgentRequestBodyDtoSchema,
        },
      )
      .get("", async ({ tenant }) => {
        const result = await listAiAgents({
          ctx: { tenant },
        });
        if (result.isErr()) {
          return errEnvelope(result.error);
        }
        return okEnvelope({
          data: result.value.data.map(toDto),
        });
      })
      .get(
        "/:id",
        async ({ tenant, params }) => {
          const result = await getAiAgent({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        {
          params: patchAiAgentRequestParamsDtoSchema,
        },
      )
      .patch(
        "/:id",
        async ({ body, tenant, params }) => {
          const result = await updateAiAgent({
            ctx: { tenant },
            id: params.id,
            data: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          body: patchAiAgentRequestBodyDtoSchema,
          params: patchAiAgentRequestParamsDtoSchema,
        },
      )
      .delete(
        "/:id",
        async ({ tenant, params }) => {
          const result = await deleteAiAgent({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          params: deleteAiAgentRequestParamsDtoSchema,
        },
      ),
  );

export { aiAgentV1Router };
