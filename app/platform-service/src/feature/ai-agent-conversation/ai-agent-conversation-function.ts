import z from "zod";

import {
  AI_AGENT_CONVERSATION_RUN_FUNCTION_ID,
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_TERMINATED_EVENT,
  AI_AGENT_RUN_USER_INPUT_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";
import {
  appendSystemErrorMessage,
  destroyVolume,
  markRunStatus,
  provisionSandbox,
  provisionVolume,
  runTurn,
  stopSandbox,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-turn";
import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
import { getEnv } from "@/vendor/env/env";
import { inngestClient } from "@/vendor/inngest/inngest-client";
import { baseLog } from "@/vendor/pino/pino-log";

const log = baseLog.child({ context: "ai-agent-conversation-function" });
const aiAgentRunMessageService = makeAiAgentRunMessageService();

const runStartedEventDataSchema = z.object({
  tenant: tenantSchema,
  aiAgentId: idSchema,
  aiAgentRunId: idSchema,
  initialMessage: z.string().min(1).max(200_000).optional(),
});

const userInputEventDataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),

    tenant: tenantSchema,
    aiAgentRunId: idSchema,

    aiAgentMessageId: idSchema,
    content: z.string(),
  }),
  z.object({
    type: z.literal("stop"),

    tenant: tenantSchema,
    aiAgentRunId: idSchema,
  }),
]);

const aiAgentConversationRun = inngestClient.createFunction(
  { id: AI_AGENT_CONVERSATION_RUN_FUNCTION_ID },
  { event: AI_AGENT_RUN_STARTED_EVENT },
  async ({ event, step }) => {
    const validationResult = validate(runStartedEventDataSchema, event.data);

    if (validationResult.isErr()) {
      log.error({ error: validationResult.error }, "invalid event data");
      return;
    }
    const { tenant, aiAgentId, aiAgentRunId, initialMessage } =
      validationResult.value;

    const ctx = { tenant };
    const idleTimeoutDays = getEnv().AI_AGENT_RUN_IDLE_TIMEOUT_DAYS;

    const { volumeId } = await step.run("provision-volume", async () => {
      const out = await provisionVolume({ aiAgentRunId });
      await markRunStatus({
        ctx,
        aiAgentRunId,
        status: "idle",
        sandbox: {
          volume: {
            integration: { externalId: out.volumeId, provider: "daytona" },
            status: "ready",
          },
          currentSandbox: null,
        },
      });
      return out;
    });

    let sessionId: string | null = null;
    let iteration = 0;

    const emitTerminated = async (
      reason: "user_stop" | "idle_timeout" | "error",
    ) => {
      const status = reason === "error" ? "errored" : "stopped";
      await step.sendEvent(`emit-terminated-${iteration}`, {
        name: AI_AGENT_RUN_TERMINATED_EVENT,
        data: { tenant, aiAgentRunId, status, endedReason: reason },
      });
    };

    const terminate = async (
      reason: "user_stop" | "idle_timeout" | "error",
    ) => {
      await step.run(`cleanup-${iteration}`, async () => {
        await destroyVolume({ aiAgentRunId });
        await markRunStatus({
          ctx,
          aiAgentRunId,
          status: reason === "error" ? "errored" : "stopped",
          endedReason: reason,
          sandbox: {
            volume: {
              integration: { externalId: volumeId, provider: "daytona" },
              status: "destroyed",
            },
            currentSandbox: null,
          },
        });
      });
      await emitTerminated(reason);
    };

    while (true) {
      iteration += 1;

      let aiAgentMessageId: Id;
      let content: string;

      if (iteration === 1 && initialMessage) {
        const seeded = await step.run("seed-initial-message", async () => {
          const appendResult = await aiAgentRunMessageService.append({
            ctx,
            payload: {
              aiAgentRunId,
              role: "user",
              content: initialMessage,
              toolName: null,
              toolInput: null,
              toolResult: null,
            },
          });
          if (appendResult.isErr()) {
            throw appendResult.error;
          }
          return {
            aiAgentMessageId: appendResult.value.data.id,
            content: initialMessage,
          };
        });
        aiAgentMessageId = seeded.aiAgentMessageId;
        content = seeded.content;
      } else {
        const userInputEvent = await step.waitForEvent(
          `wait-user-input-${iteration}`,
          {
            event: AI_AGENT_RUN_USER_INPUT_EVENT,
            match: "data.aiAgentRunId",
            timeout: `${idleTimeoutDays}d`,
          },
        );

        if (!userInputEvent) {
          await terminate("idle_timeout");
          return;
        }
        const userInputEventDataValidation = validate(
          userInputEventDataSchema,
          userInputEvent.data,
        );

        if (userInputEventDataValidation.isErr()) {
          log.error(
            { error: userInputEventDataValidation.error },
            "invalid user input event data",
          );
          continue;
        }

        if (userInputEventDataValidation.value.type === "stop") {
          await terminate("user_stop");
          return;
        }
        aiAgentMessageId = userInputEventDataValidation.value.aiAgentMessageId;
        content = userInputEventDataValidation.value.content;
      }

      const { sandboxId } = await step.run(
        `provision-sandbox-${iteration}`,
        async () => {
          const out = await provisionSandbox({ volumeId });
          await markRunStatus({
            ctx,
            aiAgentRunId,
            status: "processing",
            sandbox: {
              volume: {
                integration: { externalId: volumeId, provider: "daytona" },
                status: "ready",
              },
              currentSandbox: {
                integration: { externalId: out.sandboxId, provider: "daytona" },
                status: "running",
              },
            },
          });
          return out;
        },
      );

      try {
        const turn = await step.run(`claude-turn-${iteration}`, () =>
          runTurn({
            ctx,
            aiAgentRunId,
            aiAgentId,
            userMessageId: aiAgentMessageId,
            content,
            sandboxId,
            sessionId,
          }),
        );
        sessionId = turn.sessionId;
      } catch (error) {
        const err = Err.from(error);
        log.error({ error: err }, "claude-turn failed");

        await step.run(`handle-error-${iteration}`, async () => {
          await appendSystemErrorMessage({
            ctx,
            aiAgentRunId,
            message: err.message,
          });
          await stopSandbox({ sandboxId });
          await destroyVolume({ aiAgentRunId });
          await markRunStatus({
            ctx,
            aiAgentRunId,
            status: "errored",
            endedReason: "error",
            sandbox: {
              volume: {
                integration: { externalId: volumeId, provider: "daytona" },
                status: "destroyed",
              },
              currentSandbox: null,
            },
          });
        });
        await emitTerminated("error");
        return;
      }

      await step.run(`teardown-sandbox-${iteration}`, async () => {
        await stopSandbox({ sandboxId });
        await markRunStatus({
          ctx,
          aiAgentRunId,
          status: "idle",
          sessionId,
          sandbox: {
            volume: {
              integration: { externalId: volumeId, provider: "daytona" },
              status: "ready",
            },
            currentSandbox: null,
          },
        });
      });
    }
  },
);

const aiAgentConversationFunctions = [aiAgentConversationRun];

export { aiAgentConversationFunctions };
