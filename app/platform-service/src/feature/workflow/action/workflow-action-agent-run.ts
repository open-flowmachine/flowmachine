import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";

import z from "zod";

import {
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_TERMINATED_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
import { baseLog } from "@/vendor/pino/pino-log";

const log = baseLog.child({ context: "workflow-action-agent-run" });
const aiAgentRunService = makeAiAgentRunService();

const agentRunEventDataSchema = z.object({
  tenant: tenantSchema,
  workflowExecutionId: idSchema,
});

const agentRunInputSchema = z.object({
  aiAgentId: idSchema,
  initialMessage: z.string().min(1).max(200_000),
  mode: z.union([z.literal("fire-and-forget"), z.literal("interactive")]),
});

const agentRunAction: EngineAction<Inngest> = {
  name: "Agent Run",
  kind: "agent-run",
  description:
    "Spawn an AI Agent Run with an initial prompt; optionally wait for it to terminate.",
  handler: async ({ event, step, workflowAction }) => {
    const eventDataValidation = validate(agentRunEventDataSchema, event.data);

    if (eventDataValidation.isErr()) {
      log.error(
        { error: eventDataValidation.error, eventData: event.data },
        "invalid event data",
      );
      return;
    }
    const { tenant } = eventDataValidation.value;

    const inputValidation = validate(
      agentRunInputSchema,
      workflowAction.inputs ?? {},
    );

    if (inputValidation.isErr()) {
      log.error(
        { error: inputValidation.error, inputs: workflowAction.inputs },
        "invalid action inputs",
      );
      throw inputValidation.error;
    }
    const { aiAgentId, initialMessage, mode } = inputValidation.value;

    const { aiAgentRunId } = await step.run("create-ai-agent-run", async () => {
      const result = await aiAgentRunService.create({
        ctx: { tenant },
        payload: { aiAgentId },
      });
      if (result.isErr()) {
        throw result.error;
      }
      return { aiAgentRunId: result.value.id };
    });

    await step.sendEvent("trigger-ai-agent-run", {
      name: AI_AGENT_RUN_STARTED_EVENT,
      data: { tenant, aiAgentId, aiAgentRunId, initialMessage },
    });

    if (mode === "fire-and-forget") {
      return { aiAgentRunId };
    }

    await step.waitForEvent("wait-for-agent-run-terminated", {
      event: AI_AGENT_RUN_TERMINATED_EVENT,
      match: "data.aiAgentRunId",
      timeout: "30d",
    });

    return { aiAgentRunId };
  },
};

export { agentRunAction };
