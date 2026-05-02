import { isNil } from "es-toolkit";
import z from "zod";

import {
  AI_AGENT_SESSION_INITIALIZATION_REQUESTED_HANDLER_ID,
  AI_AGENT_SESSION_INITIALIZED_HANDLER_ID,
  AI_AGENT_SESSION_SCHEDULED_CLEAN_UP_HANDLER_ID,
} from "@/feature/workflow/ai-agent-session/ai-agent-session-constant";
import {
  aiAgentSessionInitializationRequestEvent,
  aiAgentSessionInitializedEvent,
  aiAgentSessionUserInputReceivedEvent,
} from "@/feature/workflow/ai-agent-session/ai-agent-session-event";
import {
  appendUserMessage,
  createAiAgentRun,
  getAiAgentRun,
  createSandbox,
  startSandbox,
  runTurn,
  stopSandbox,
  adminListNonActiveAiAgentRuns,
  adminMarkAiAgentRunAsStopping,
  adminMarkAiAgentRunAsStopped,
  markAiAgentRunAsInitializing,
  markAiAgentRunAsInitialized,
} from "@/feature/workflow/ai-agent-session/ai-agent-session-step";
import { isInitializedAiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import { Err } from "@/shared/err/err";
import { validate } from "@/shared/schema/schema-validation";
import { inngestClient } from "@/vendor/inngest/inngest-client";
import { makeInngestFnHandler } from "@/vendor/inngest/inngest-util";

const aiAgentSessionInitializeRequestHandler = inngestClient.createFunction(
  { id: AI_AGENT_SESSION_INITIALIZATION_REQUESTED_HANDLER_ID },
  { event: aiAgentSessionInitializationRequestEvent.name() },
  makeInngestFnHandler({
    dataSchema: aiAgentSessionInitializationRequestEvent.dataSchema(),
    handler: async (input) => {
      const { event, step } = input;
      const { data } = event;

      let aiAgentRunId = data.aiAgentRunId;

      if (isNil(aiAgentRunId)) {
        const result = await step.run(
          "ai-agent-run/create",
          createAiAgentRun({
            tenant: data.tenant,
            aiAgentId: data.aiAgentId,
          }),
        );
        aiAgentRunId = result.id;
      }

      const aiAgentRun = await step.run(
        `ai-agent-run/${aiAgentRunId}/get`,
        getAiAgentRun({
          tenant: data.tenant,
          aiAgentRunId,
        }),
      );

      if (isNil(aiAgentRun.sandbox)) {
        await step.run(
          `ai-agent-run/${aiAgentRunId}/mark-as-initializing`,
          markAiAgentRunAsInitializing({
            tenant: data.tenant,
            aiAgentRunId: aiAgentRun.id,
          }),
        );

        const { sandboxId } = await step.run(
          `ai-agent-run/${aiAgentRunId}/create-sandbox`,
          createSandbox(),
        );

        await step.run(
          `ai-agent-run/${aiAgentRunId}/mark-as-initialized`,
          markAiAgentRunAsInitialized({
            tenant: data.tenant,
            aiAgentRunId: aiAgentRun.id,
            sandboxId,
          }),
        );
      }

      await step.sendEvent(
        `ai-agent-run/${aiAgentRunId}/send-initialized-event`,
        aiAgentSessionInitializedEvent.make({
          data: {
            tenant: data.tenant,
            aiAgentId: data.aiAgentId,
            aiAgentRunId: aiAgentRun.id,
          },
        }),
      );
    },
  }),
);

const aiAgentSessionInitializedHandler = inngestClient.createFunction(
  { id: AI_AGENT_SESSION_INITIALIZED_HANDLER_ID },
  { event: aiAgentSessionInitializedEvent.name() },
  makeInngestFnHandler({
    dataSchema: aiAgentSessionInitializedEvent.dataSchema(),
    handler: async (input) => {
      const { event, step } = input;
      const { data } = event;

      const aiAgentRun = await step.run(
        `ai-agent-run/${data.aiAgentRunId}/get`,
        getAiAgentRun({
          tenant: data.tenant,
          aiAgentRunId: data.aiAgentRunId,
        }),
      );

      if (!isInitializedAiAgentRun(aiAgentRun)) {
        throw Err.code("unprocessableEntity", {
          message: "invalid ai agent run status",
        });
      }

      const sandbox = await startSandbox({
        sandboxId: aiAgentRun.sandbox.integration.externalId,
      });

      let sessionId = aiAgentRun.sessionId;
      let iteration = 1;

      while (true) {
        const currentRun = await step.run(
          `ai-agent-run/${data.aiAgentRunId}/check-status-${iteration}`,
          getAiAgentRun({
            tenant: data.tenant,
            aiAgentRunId: data.aiAgentRunId,
          }),
        );

        if (
          currentRun.status === "stopping" ||
          currentRun.status === "stopped" ||
          currentRun.status === "failed"
        ) {
          break;
        }

        if (iteration > 1000) {
          break;
        }

        const userInputEvent = await step.waitForEvent(
          `ai-agent-run/${data.aiAgentRunId}/wait-user-input-${iteration}`,
          {
            event: aiAgentSessionUserInputReceivedEvent.name(),
            match: "data.aiAgentRunId",
            timeout: "1d",
          },
        );

        const userInputValidationResult = validate(
          aiAgentSessionUserInputReceivedEvent.dataSchema(),
          userInputEvent?.data,
        );

        if (userInputValidationResult.isErr()) {
          continue;
        }
        const userInput = userInputValidationResult.value;

        const userMessageId = await step.run(
          `ai-agent-run/${data.aiAgentRunId}/append-user-message-${iteration}`,
          appendUserMessage({
            tenant: data.tenant,
            aiAgentRunId: data.aiAgentRunId,
            content: userInput.content,
          }),
        );

        const runTurnResult = await step.run(
          `ai-agent-run/${data.aiAgentRunId}/run-turn-${iteration}`,
          runTurn({
            tenant: data.tenant,
            aiAgentRunId: data.aiAgentRunId,
            aiAgentId: data.aiAgentId,
            userMessageId,
            content: userInput.content,
            sandboxId: sandbox.id,
            sessionId,
          }),
        );

        sessionId = runTurnResult.sessionId;
        iteration++;
      }
    },
  }),
);

const aiAgentSessionScheduledCleanUpHandler = inngestClient.createFunction(
  { id: AI_AGENT_SESSION_SCHEDULED_CLEAN_UP_HANDLER_ID },
  { cron: "TZ=UTC */15 * * * *" },
  makeInngestFnHandler({
    dataSchema: z.unknown(),
    handler: async (input) => {
      const { step } = input;

      const nonActiveAiAgentRuns = await step.run(
        "ai-agent-run/admin-list-non-active",
        adminListNonActiveAiAgentRuns(),
      );

      for (const aiAgentRun of nonActiveAiAgentRuns) {
        if (!isInitializedAiAgentRun(aiAgentRun)) {
          continue;
        }

        await step.run(
          `ai-agent-run/${aiAgentRun.id}/mark-as-stopping`,
          adminMarkAiAgentRunAsStopping({ id: aiAgentRun.id }),
        );
        await step.run(
          `ai-agent-run/${aiAgentRun.id}/stop-sandbox`,
          stopSandbox({ sandboxId: aiAgentRun.sandbox.integration.externalId }),
        );
        await step.run(
          `ai-agent-run/${aiAgentRun.id}/mark-as-stopped`,
          adminMarkAiAgentRunAsStopped({ id: aiAgentRun.id }),
        );
      }
    },
  }),
);

const aiAgentSessionFunctions = [
  aiAgentSessionInitializeRequestHandler,
  aiAgentSessionInitializedHandler,
  aiAgentSessionScheduledCleanUpHandler,
];

export { aiAgentSessionFunctions };
