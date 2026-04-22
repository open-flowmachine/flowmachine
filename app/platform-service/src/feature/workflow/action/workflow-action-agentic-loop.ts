import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";

import z from "zod";

import { makeWorkflowExecutionService } from "@/module/workflow/workflow-execution-service";
import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
import { daytonaClient } from "@/vendor/daytona/daytona-client";
import { baseLog } from "@/vendor/pino/pino-log";

const agenticLoopEventDataSchema = z.object({
  tenant: tenantSchema,
  workflowExecutionId: idSchema,
});

const log = baseLog.child({ context: "workflow-action-agentic-loop" });
const workflowExecutionService = makeWorkflowExecutionService();

const agenticLoopAction: EngineAction<Inngest> = {
  name: "Agentic Loop",
  kind: "agentic-loop",
  handler: async ({ event, step }) => {
    const validationResult = validate(agenticLoopEventDataSchema, event.data);
    if (validationResult.isErr()) {
      log.error(
        { error: validationResult.error, eventData: event.data },
        "Invalid event data",
      );
      return;
    }
    const { tenant, workflowExecutionId } = validationResult.value;

    const { sandboxId } = await step.run("daytona-create-sandbox", async () => {
      const sandbox = await daytonaClient.create();
      return { sandboxId: sandbox.id };
    });

    await step.run("mark-sandbox-running", async () => {
      const result = await workflowExecutionService.update({
        ctx: { tenant },
        id: workflowExecutionId,
        data: {
          sandbox: {
            volume: {
              integration: { externalId: "stub", provider: "daytona" },
              status: "ready",
            },
            currentSandbox: {
              integration: { externalId: sandboxId, provider: "daytona" },
              status: "running",
              actionId: "agentic-loop",
            },
          },
        },
      });
      if (result.isErr()) {
        throw result.error;
      }
    });

    await step.run("daytona-exec-pwd", async () => {
      const sandbox = await daytonaClient.get(sandboxId);
      const response = await sandbox.process.executeCommand("pwd");
      log.info({ sandboxId, stdout: response.result }, "pwd executed");
      return { stdout: response.result };
    });

    await step.run("daytona-stop-sandbox", async () => {
      const sandbox = await daytonaClient.get(sandboxId);
      await daytonaClient.stop(sandbox);
    });

    await step.run("mark-sandbox-destroyed", async () => {
      const result = await workflowExecutionService.update({
        ctx: { tenant },
        id: workflowExecutionId,
        data: {
          sandbox: {
            volume: {
              integration: { externalId: "stub", provider: "daytona" },
              status: "ready",
            },
            currentSandbox: {
              integration: { externalId: sandboxId, provider: "daytona" },
              status: "destroyed",
              actionId: "agentic-loop",
            },
          },
        },
      });
      if (result.isErr()) {
        throw result.error;
      }
    });
  },
};

export { agenticLoopAction };
