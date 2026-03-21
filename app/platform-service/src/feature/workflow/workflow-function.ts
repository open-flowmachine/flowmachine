import z from "zod";
import {
  WORKFLOW_EXECUTION_INITIALIZED_EVENT,
  WORKFLOW_EXECUTION_INITIALIZE_FUNCTION_ID,
  WORKFLOW_EXECUTION_START_FUNCTION_ID,
  WORKFLOW_EXECUTION_TRIGGERED_EVENT,
} from "@/feature/workflow/workflow-constant";
import { workflowEngine } from "@/feature/workflow/workflow-engine";
import { makeWorkflowExecutionService } from "@/module/workflow/workflow-execution-service";
import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const workflowExecutionService = makeWorkflowExecutionService();

const initializeWorkflowExecutionEventDataSchema = z.object({
  tenant: tenantSchema,
  workflowDefinitionId: idSchema,
});

const initializeWorkflowExecution = inngestClient.createFunction(
  { id: WORKFLOW_EXECUTION_INITIALIZE_FUNCTION_ID },
  { event: WORKFLOW_EXECUTION_TRIGGERED_EVENT },
  async (input) => {
    const { event, step } = input;

    const validationResult = validate(
      initializeWorkflowExecutionEventDataSchema,
      event.data,
    );

    if (validationResult.isErr()) {
      console.error("Invalid event data:", validationResult.error);
      return;
    }
    const { tenant, workflowDefinitionId } = validationResult.value;

    await step.sendEvent(`send-${WORKFLOW_EXECUTION_INITIALIZED_EVENT}`, {
      name: WORKFLOW_EXECUTION_INITIALIZED_EVENT,
      data: {
        tenant,
        workflowDefinitionId,
      },
    });
  },
);

const startWorkflowExecution = inngestClient.createFunction(
  { id: WORKFLOW_EXECUTION_START_FUNCTION_ID },
  { event: WORKFLOW_EXECUTION_INITIALIZED_EVENT },
  async (input) => {
    console.log("Starting workflow execution with input:", input);
    const { event, step } = input;
    await workflowEngine.run({ event, step });
  },
);

const workflowFunctions = [initializeWorkflowExecution, startWorkflowExecution];

export { workflowFunctions };
