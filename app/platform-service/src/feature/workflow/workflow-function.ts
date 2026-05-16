import z from "zod";

import {
  WORKFLOW_EXECUTION_INITIALIZED_EVENT,
  WORKFLOW_EXECUTION_INITIALIZE_FUNCTION_ID,
  WORKFLOW_EXECUTION_START_FUNCTION_ID,
  WORKFLOW_EXECUTION_TRIGGERED_EVENT,
} from "@/feature/workflow/workflow-constant";
import { workflowEngine } from "@/feature/workflow/workflow-engine";
import { makeWorkflowExecutionService } from "@/module/workflow/workflow-execution-service";
import { Err } from "@/shared/err/err";
import { idSchema } from "@/shared/model/model-id";
import { validate } from "@/shared/schema/schema-validation";
import { tenantSchema } from "@/shared/tenant/tenant-model";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const workflowExecutionService = makeWorkflowExecutionService();

const initializeWorkflowExecutionEventDataSchema = z.object({
  tenant: tenantSchema,
  workflowDefinitionId: idSchema,
  aiAgentId: idSchema,
  gitRepositoryId: idSchema,
  title: z.string().optional(),
  summary: z.string().optional(),
});

const initializeWorkflowExecution = inngestClient.createFunction(
  { id: WORKFLOW_EXECUTION_INITIALIZE_FUNCTION_ID },
  { event: WORKFLOW_EXECUTION_TRIGGERED_EVENT },
  async (input) => {
    const { event, step, log } = input as typeof input & {
      log: import("pino").Logger;
    };

    const validationResult = validate(
      initializeWorkflowExecutionEventDataSchema,
      event.data,
    );

    if (validationResult.isErr()) {
      log.warn({ err: validationResult.error }, "invalid event data");
      return;
    }
    const {
      tenant,
      workflowDefinitionId,
      aiAgentId,
      gitRepositoryId,
      title,
      summary,
    } = validationResult.value;

    const workflowExecutionId = await step.run(
      "create-workflow-execution",
      async () => {
        const result = await workflowExecutionService.create({
          ctx: { tenant },
          payload: {
            integration: {
              externalId: event.id ?? "",
              provider: "inngest",
            },
            workflowDefinition: {
              id: workflowDefinitionId,
              raw: {},
            },
          },
        });
        if (result.isErr()) {
          throw Err.from(result.error);
        }
        return result.value.id;
      },
    );

    await step.sendEvent(`send-${WORKFLOW_EXECUTION_INITIALIZED_EVENT}`, {
      name: WORKFLOW_EXECUTION_INITIALIZED_EVENT,
      data: {
        tenant,
        workflowDefinitionId,
        workflowExecutionId,
        aiAgentId,
        gitRepositoryId,
        title,
        summary,
      },
    });
  },
);

const startWorkflowExecution = inngestClient.createFunction(
  { id: WORKFLOW_EXECUTION_START_FUNCTION_ID },
  { event: WORKFLOW_EXECUTION_INITIALIZED_EVENT },
  async (input) => {
    const { event, step, log } = input as typeof input & {
      log: import("pino").Logger;
    };
    log.info(
      {
        workflowDefinitionId: (event.data as { workflowDefinitionId?: string })
          .workflowDefinitionId,
        aiAgentId: (event.data as { aiAgentId?: string }).aiAgentId,
      },
      "starting workflow execution",
    );
    await workflowEngine.run({ event, step });
  },
);

const workflowFunctions = [initializeWorkflowExecution, startWorkflowExecution];

export { workflowFunctions };
