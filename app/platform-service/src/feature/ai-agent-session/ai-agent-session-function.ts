import type { Sandbox } from "@daytonaio/sdk";

import { isNil, noop } from "es-toolkit";
import z from "zod";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";

import {
  AI_AGENT_SESSION_INITIALIZATION_REQUESTED_HANDLER_ID,
  AI_AGENT_SESSION_INITIALIZED_HANDLER_ID,
  AI_AGENT_SESSION_BATCH_TERMINATION_REQUESTED_HANDLER_ID,
} from "@/feature/ai-agent-session/ai-agent-session-constant";
import {
  aiAgentSessionInitializationRequestEvent,
  aiAgentSessionInitializedEvent,
  aiAgentSessionUserInputReceivedEvent,
} from "@/feature/ai-agent-session/ai-agent-session-event";
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

      const aiAgentRun: AiAgentRun = isNil(data.aiAgentRunId)
        ? await step.run("create-ai-agent-run", noop)
        : await step.run("get-ai-agent-run", noop);

      const sandbox = isNil(aiAgentRun.sandbox)
        ? await step.run("create-sandbox", noop)
        : await step.run("get-sandbox", noop);

      await step.run("update-ai-agent-run", noop);

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

      const aiAgentRun: AiAgentRun = await step.run("get-ai-agent-run", noop);
      const sandbox: Sandbox = await startSandbox();

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

        await step.run("turn", noop);
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

        const aiAgentRuns: AiAgentRun[] = await step.run(
          "list-ai-agent-runs",
          noop,
        );

        for (const aiAgentRun of aiAgentRuns) {
          const sandboxId =
            aiAgentRun.sandbox?.currentSandbox?.integration.externalId;

          if (isNil(sandboxId)) {
            continue;
          }
          await step.run("stop-sandbox", noop);
        }
      },
    }),
  );
