import Elysia from "elysia";

import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type {
  AiAgentConversationEvent,
  AiAgentConversationMessageAppendedEvent,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-event";
import type {
  AiAgentResponseDto,
  AiAgentRunMessageResponseDto,
  AiAgentRunResponseDto,
} from "@/router/ai-agent/v1/router-ai-agent-v1-dto";
import type { Tenant } from "@/shared/model/model-tenant";

import {
  AI_AGENT_RUN_MESSAGE_RECEIVED_EVENT,
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_STOP_REQUESTED_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";
import { aiAgentConversationEventBus } from "@/feature/ai-agent-conversation/ai-agent-conversation-event";
import { makeAiAgentService } from "@/module/ai-agent/ai-agent-service";
import { aiAgentRunTerminalStatuses } from "@/module/ai-agent-run/ai-agent-run-model";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import {
  aiAgentRunRequestParamsDtoSchema,
  aiAgentRunWithIdRequestParamsDtoSchema,
  deleteAiAgentRequestParamsDtoSchema,
  patchAiAgentRequestBodyDtoSchema,
  patchAiAgentRequestParamsDtoSchema,
  postAiAgentRequestBodyDtoSchema,
  postAiAgentRunMessageRequestBodyDtoSchema,
  postAiAgentRunRequestBodyDtoSchema,
} from "@/router/ai-agent/v1/router-ai-agent-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { Err } from "@/shared/err/err";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";
import { type Id } from "@/shared/model/model-id";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const aiAgentService = makeAiAgentService();
const aiAgentRunService = makeAiAgentRunService();
const aiAgentRunMessageService = makeAiAgentRunMessageService();

const toDto = (aiAgent: AiAgent) =>
  ({
    id: aiAgent.id,
    createdAt: aiAgent.createdAt,
    updatedAt: aiAgent.updatedAt,
    name: aiAgent.name,
    model: aiAgent.model,
    projects: aiAgent.projects,
  }) satisfies AiAgentResponseDto;

const toRunDto = (run: AiAgentRun) =>
  ({
    id: run.id,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    aiAgentId: run.aiAgentId,
    status: run.status,
    sessionId: run.sessionId,
    startedAt: run.startedAt,
    lastMessageAt: run.lastMessageAt,
    endedAt: run.endedAt,
    endedReason: run.endedReason,
  }) satisfies AiAgentRunResponseDto;

const toMessageDto = (message: AiAgentRunMessage) =>
  ({
    id: message.id,
    createdAt: message.createdAt,
    aiAgentRunId: message.aiAgentRunId,
    role: message.role,
    content: message.content,
    toolName: message.toolName,
    toolInput: message.toolInput,
    toolResult: message.toolResult,
  }) satisfies AiAgentRunMessageResponseDto;

const isTerminal = (status: AiAgentRun["status"]) =>
  (aiAgentRunTerminalStatuses as readonly AiAgentRun["status"][]).includes(
    status,
  );

const loadScopedRun = async (input: {
  tenant: Tenant;
  aiAgentId: Id;
  runId: Id;
}) => {
  const runResult = await aiAgentRunService.get({
    ctx: { tenant: input.tenant },
    id: input.runId,
  });
  if (runResult.isErr()) {
    return runResult;
  }
  if (runResult.value.data.aiAgentId !== input.aiAgentId) {
    return { isErr: () => true, isOk: () => false, error: Err.code("notFound") } as never;
  }
  return runResult;
};

const encodeSseEvent = (input: { event: string; data: unknown }) =>
  `event: ${input.event}\ndata: ${JSON.stringify(input.data)}\n\n`;

const aiAgentV1Router = new Elysia({ name: "aiAgentV1HttpRouter" })
  .use(routerAuthGuard)
  .group("/api/v1/ai-agent", (r) =>
    r
      .post(
        "",
        async ({ body, tenant }) => {
          const result = await aiAgentService.create({
            ctx: { tenant },
            payload: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: { id: result.value.id } });
        },
        { body: postAiAgentRequestBodyDtoSchema },
      )
      .get("", async ({ tenant }) => {
        const result = await aiAgentService.list({ ctx: { tenant } });
        if (result.isErr()) {
          return errEnvelope(result.error);
        }
        return okEnvelope({ data: result.value.data.map(toDto) });
      })
      .get(
        "/:aiAgentId",
        async ({ tenant, params }) => {
          const result = await aiAgentService.get({
            ctx: { tenant },
            id: params.aiAgentId,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        { params: patchAiAgentRequestParamsDtoSchema },
      )
      .patch(
        "/:aiAgentId",
        async ({ body, tenant, params }) => {
          const result = await aiAgentService.update({
            ctx: { tenant },
            id: params.aiAgentId,
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
        "/:aiAgentId",
        async ({ tenant, params }) => {
          const result = await aiAgentService.delete({
            ctx: { tenant },
            id: params.aiAgentId,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        { params: deleteAiAgentRequestParamsDtoSchema },
      )
      .post(
        "/:aiAgentId/run",
        async ({ tenant, params }) => {
          const { aiAgentId } = params;

          const agentResult = await aiAgentService.get({
            ctx: { tenant },
            id: aiAgentId,
          });
          if (agentResult.isErr()) {
            return errEnvelope(agentResult.error);
          }

          const result = await aiAgentRunService.create({
            ctx: { tenant },
            payload: { aiAgentId },
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }

          await inngestClient.send({
            name: AI_AGENT_RUN_STARTED_EVENT,
            data: { tenant, aiAgentId, aiAgentRunId: result.value.id },
          });

          return okEnvelope({
            status: 202,
            code: "accepted",
            message: "accepted",
            data: { runId: result.value.id },
          });
        },
        {
          body: postAiAgentRunRequestBodyDtoSchema,
          params: aiAgentRunRequestParamsDtoSchema,
        },
      )
      .get(
        "/:aiAgentId/run",
        async ({ tenant, params }) => {
          const agentResult = await aiAgentService.get({
            ctx: { tenant },
            id: params.aiAgentId,
          });
          if (agentResult.isErr()) {
            return errEnvelope(agentResult.error);
          }

          const result = await aiAgentRunService.list({
            ctx: { tenant },
            filter: { aiAgentId: params.aiAgentId },
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: result.value.data.map(toRunDto) });
        },
        { params: aiAgentRunRequestParamsDtoSchema },
      )
      .get(
        "/:aiAgentId/run/:runId",
        async ({ tenant, params }) => {
          const runResult = await loadScopedRun({
            tenant,
            aiAgentId: params.aiAgentId,
            runId: params.runId,
          });
          if (runResult.isErr()) {
            return errEnvelope(runResult.error);
          }
          return okEnvelope({ data: toRunDto(runResult.value.data) });
        },
        { params: aiAgentRunWithIdRequestParamsDtoSchema },
      )
      .post(
        "/:aiAgentId/run/:runId/stop",
        async ({ tenant, params }) => {
          const runResult = await loadScopedRun({
            tenant,
            aiAgentId: params.aiAgentId,
            runId: params.runId,
          });
          if (runResult.isErr()) {
            return errEnvelope(runResult.error);
          }
          if (isTerminal(runResult.value.data.status)) {
            return errEnvelope(
              Err.code("conflict", { message: "Run is already terminated" }),
            );
          }

          await inngestClient.send({
            name: AI_AGENT_RUN_STOP_REQUESTED_EVENT,
            data: { tenant, aiAgentRunId: params.runId },
          });
          return okEnvelope({ status: 202, code: "accepted", message: "accepted" });
        },
        { params: aiAgentRunWithIdRequestParamsDtoSchema },
      )
      .post(
        "/:aiAgentId/run/:runId/message",
        async ({ tenant, params, body }) => {
          const runResult = await loadScopedRun({
            tenant,
            aiAgentId: params.aiAgentId,
            runId: params.runId,
          });
          if (runResult.isErr()) {
            return errEnvelope(runResult.error);
          }

          const appendResult = await aiAgentRunMessageService.append({
            ctx: { tenant },
            payload: {
              aiAgentRunId: params.runId,
              role: "user",
              content: body.content,
              toolName: null,
              toolInput: null,
              toolResult: null,
            },
          });
          if (appendResult.isErr()) {
            return errEnvelope(appendResult.error);
          }

          const markResult = await aiAgentRunService.markProcessing({
            ctx: { tenant },
            id: params.runId,
          });
          if (markResult.isErr()) {
            return errEnvelope(markResult.error);
          }

          await inngestClient.send({
            name: AI_AGENT_RUN_MESSAGE_RECEIVED_EVENT,
            data: {
              tenant,
              aiAgentRunId: params.runId,
              aiAgentMessageId: appendResult.value.data.id,
              content: body.content,
            },
          });

          return okEnvelope({
            status: 202,
            code: "accepted",
            message: "accepted",
            data: { messageId: appendResult.value.data.id },
          });
        },
        {
          params: aiAgentRunWithIdRequestParamsDtoSchema,
          body: postAiAgentRunMessageRequestBodyDtoSchema,
        },
      )
      .get(
        "/:aiAgentId/run/:runId/message",
        async ({ tenant, params }) => {
          const runResult = await loadScopedRun({
            tenant,
            aiAgentId: params.aiAgentId,
            runId: params.runId,
          });
          if (runResult.isErr()) {
            return errEnvelope(runResult.error);
          }

          const result = await aiAgentRunMessageService.list({
            ctx: { tenant },
            filter: { aiAgentRunId: params.runId },
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: result.value.data.map(toMessageDto) });
        },
        { params: aiAgentRunWithIdRequestParamsDtoSchema },
      )
      .post(
        "/:aiAgentId/run/:runId/retry",
        async ({ tenant, params }) => {
          const runResult = await loadScopedRun({
            tenant,
            aiAgentId: params.aiAgentId,
            runId: params.runId,
          });
          if (runResult.isErr()) {
            return errEnvelope(runResult.error);
          }
          if (runResult.value.data.status !== "errored") {
            return errEnvelope(
              Err.code("conflict", {
                message: "Only errored runs can be retried",
              }),
            );
          }

          const messagesResult = await aiAgentRunMessageService.list({
            ctx: { tenant },
            filter: { aiAgentRunId: params.runId },
          });
          if (messagesResult.isErr()) {
            return errEnvelope(messagesResult.error);
          }

          const lastUserMessage = messagesResult.value.data
            .filter((m) => m.role === "user")
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
          if (!lastUserMessage) {
            return errEnvelope(
              Err.code("badRequest", { message: "No user message to retry" }),
            );
          }

          await inngestClient.send({
            name: AI_AGENT_RUN_MESSAGE_RECEIVED_EVENT,
            data: {
              tenant,
              aiAgentRunId: params.runId,
              aiAgentMessageId: lastUserMessage.id,
              content: lastUserMessage.content,
            },
          });
          return okEnvelope({ status: 202, code: "accepted", message: "accepted" });
        },
        { params: aiAgentRunWithIdRequestParamsDtoSchema },
      )
      .get(
        "/:aiAgentId/run/:runId/events",
        async ({ tenant, params, set }) => {
          const runResult = await loadScopedRun({
            tenant,
            aiAgentId: params.aiAgentId,
            runId: params.runId,
          });
          if (runResult.isErr()) {
            return errEnvelope(runResult.error);
          }

          const runId = params.runId;
          const encoder = new TextEncoder();

          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              let closed = false;
              const safeEnqueue = (chunk: Uint8Array) => {
                if (closed) {
                  return;
                }
                try {
                  controller.enqueue(chunk);
                } catch {
                  closed = true;
                }
              };

              const onEvent = (event: AiAgentConversationEvent) => {
                if (event.type === "message.appended") {
                  const payload = event as AiAgentConversationMessageAppendedEvent;
                  safeEnqueue(
                    encoder.encode(
                      encodeSseEvent({
                        event: "message.appended",
                        data: {
                          aiAgentRunId: payload.aiAgentRunId,
                          message: toMessageDto(payload.message),
                        },
                      }),
                    ),
                  );
                  return;
                }
                safeEnqueue(encoder.encode(encodeSseEvent({ event: event.type, data: event })));
              };

              const unsubscribe = aiAgentConversationEventBus.subscribe(
                runId,
                onEvent,
              );

              const heartbeat = setInterval(() => {
                safeEnqueue(encoder.encode(": heartbeat\n\n"));
              }, 15_000);

              const close = () => {
                closed = true;
                clearInterval(heartbeat);
                unsubscribe();
                try {
                  controller.close();
                } catch {}
              };

              (controller as unknown as { _close?: () => void })._close = close;
            },
            cancel() {
              const self = this as unknown as { _close?: () => void };
              self._close?.();
            },
          });

          set.headers["content-type"] = "text/event-stream";
          set.headers["cache-control"] = "no-cache, no-transform";
          set.headers["connection"] = "keep-alive";
          set.headers["x-accel-buffering"] = "no";

          return new Response(stream, {
            headers: {
              "content-type": "text/event-stream",
              "cache-control": "no-cache, no-transform",
              connection: "keep-alive",
            },
          });
        },
        { params: aiAgentRunWithIdRequestParamsDtoSchema },
      ),
  );

export { aiAgentV1Router };
