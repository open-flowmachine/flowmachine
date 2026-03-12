import type { InngestFunction } from "inngest";
import type { WorkflowActionDefinitionCrudService } from "@/core/domain/workflow/definition/action/crud-service";
import { InngestFunctionFactory } from "@/orchestrator/inngest/function-factory";
import { InngestWorkflowEngineFactory } from "@/orchestrator/inngest/workflow-engine-factory";
import {
  SDLC_WORKFLOW_FUNCTION_ID,
  SDLC_WORKFLOW_INIT_EVENT,
} from "@/orchestrator/workflow/sdlc/constant";

class WorkflowSdlcFunctionFactory {
  #inngestFunctionFactory: InngestFunctionFactory;
  #inngestWorkflowEngineFactory: InngestWorkflowEngineFactory;
  #workflowSdlcActionDefinitionCrudService: WorkflowActionDefinitionCrudService;

  constructor(
    inngestFunctionFactory: InngestFunctionFactory,
    inngestWorkflowEngineFactory: InngestWorkflowEngineFactory,
    workflowSdlcActionDefinitionCrudService: WorkflowActionDefinitionCrudService,
  ) {
    this.#inngestFunctionFactory = inngestFunctionFactory;
    this.#inngestWorkflowEngineFactory = inngestWorkflowEngineFactory;
    this.#workflowSdlcActionDefinitionCrudService =
      workflowSdlcActionDefinitionCrudService;
  }

  make(): InngestFunction.Any {
    return this.#inngestFunctionFactory.make({
      config: { id: SDLC_WORKFLOW_FUNCTION_ID },
      trigger: { event: SDLC_WORKFLOW_INIT_EVENT },
      handler: async (payload) => {
        const workflowActionDefinitionsResult =
          await this.#workflowSdlcActionDefinitionCrudService.list();

        if (workflowActionDefinitionsResult.isErr()) {
          return workflowActionDefinitionsResult;
        }
        const workflowEngine = await this.#inngestWorkflowEngineFactory.make({
          workflowActionDefinitions: workflowActionDefinitionsResult.value,
        });

        await workflowEngine.run(payload);
      },
    });
  }
}

export { WorkflowSdlcFunctionFactory };
