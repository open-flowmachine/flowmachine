import {
  WORKFLOW_EXECUTION_INITIALIZED_EVENT,
  WORKFLOW_EXECUTION_INITIALIZE_FUNCTION_ID,
  WORKFLOW_EXECUTION_START_FUNCTION_ID,
  WORKFLOW_EXECUTION_TRIGGERED_EVENT,
} from "@/feature/workflow/workflow-constant";
import { workflowEngine } from "@/feature/workflow/workflow-engine";
import { makeWorkflowExecutionService } from "@/module/workflow/workflow-execution-service";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const workflowExecutionService = makeWorkflowExecutionService();

const initializeWorkflowExecution = inngestClient.createFunction(
  { id: WORKFLOW_EXECUTION_INITIALIZE_FUNCTION_ID },
  { event: WORKFLOW_EXECUTION_TRIGGERED_EVENT },
  async (input) => {
    console.log("Initializing workflow execution with input:", input);
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
