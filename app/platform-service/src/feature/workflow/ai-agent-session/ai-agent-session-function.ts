import { isNil } from "es-toolkit";
import z from "zod";

import {
  AI_AGENT_SESSION_INITIALIZATION_REQUESTED_HANDLER_ID,
  AI_AGENT_SESSION_INITIALIZED_HANDLER_ID,
  AI_AGENT_SESSION_BATCH_TERMINATION_REQUESTED_HANDLER_ID,
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
  updateAiAgentRun,
  createSandbox,
  startSandbox,
  runTurn,
  stopSandbox,
  adminListActiveAiAgentRuns,
} from "@/feature/workflow/ai-agent-session/ai-agent-session-step";
import { isInitializedAiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import { Err } from "@/shared/err/err";
import { validate } from "@/shared/schema/schema-validation";
import { inngestClient } from "@/vendor/inngest/inngest-client";
import { makeInngestFnHandler } from "@/vendor/inngest/inngest-util";

const aiAgentSessionInitialize = inngestClient.createFunction(
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
          "create-ai-agent-run",
          createAiAgentRun({
            tenant: data.tenant,
            aiAgentId: data.aiAgentId,
          }),
        );
        aiAgentRunId = result.id;
      }

      const aiAgentRun = await step.run(
        "get-ai-agent-run",
        getAiAgentRun({
          tenant: data.tenant,
          aiAgentRunId,
        }),
      );

      if (isNil(aiAgentRun.sandbox)) {
        await step.run(
          "update-ai-agent-run",
          updateAiAgentRun({
            tenant: data.tenant,
            aiAgentRunId: aiAgentRun.id,
            data: {
              status: "initializing",
              sandbox: null,
            },
          }),
        );

        const { sandboxId } = await step.run("create-sandbox", createSandbox());

        await step.run(
          "update-ai-agent-run",
          updateAiAgentRun({
            tenant: data.tenant,
            aiAgentRunId: aiAgentRun.id,
            data: {
              status: "initialized",
              sandbox: {
                integration: {
                  externalId: sandboxId,
                  provider: "daytona",
                },
                status: "running",
              },
            },
          }),
        );
      }

      await step.sendEvent(
        `send-initialized-event`,
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
        "get-ai-agent-run",
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
        const userInputEvent = await step.waitForEvent(
          `wait-user-input-${iteration}`,
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
          `append-user-message-${iteration}`,
          appendUserMessage({
            tenant: data.tenant,
            aiAgentRunId: data.aiAgentRunId,
            content: userInput.content,
          }),
        );

        const runTurnResult = await step.run(
          `run-turn-${iteration}`,
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

const aiAgentSessionBatchTerminationRequestedHandler =
  inngestClient.createFunction(
    { id: AI_AGENT_SESSION_BATCH_TERMINATION_REQUESTED_HANDLER_ID },
    { cron: "TZ=UTC */15 * * * *" },
    makeInngestFnHandler({
      dataSchema: z.unknown(),
      handler: async (input) => {
        const { step } = input;

        const aiAgentRuns = await step.run(
          "admin-list-ai-agent-runs",
          adminListActiveAiAgentRuns(),
        );

        for (const aiAgentRun of aiAgentRuns) {
          if (!isInitializedAiAgentRun(aiAgentRun)) {
            continue;
          }
          const sandboxId = aiAgentRun.sandbox.integration.externalId;
          await step.run("stop-sandbox", stopSandbox({ sandboxId }));
        }
      },
    }),
  );
