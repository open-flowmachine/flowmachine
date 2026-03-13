import type { Inngest } from "inngest";
import type { WorkflowActionDefinitionCrudService } from "@/core/domain/workflow/definition/action/crud-service";
import {
  SDLC_WORKFLOW_FUNCTION_ID,
  SDLC_WORKFLOW_INIT_EVENT,
} from "@/orchestrator/workflow/sdlc/constant";
import type { WorkflowSdlcEngineFactory } from "@/orchestrator/workflow/sdlc/engine-factory";

class WorkflowSdlcFunctionFactory {
  #inngest: Inngest;
  #workflowSdlcEngineFactory: WorkflowSdlcEngineFactory;
  #workflowSdlcActionDefinitionCrudService: WorkflowActionDefinitionCrudService;

  constructor(
    inngest: Inngest,
    workflowSdlcEngineFactory: WorkflowSdlcEngineFactory,
    workflowSdlcActionDefinitionCrudService: WorkflowActionDefinitionCrudService,
  ) {
    this.#inngest = inngest;
    this.#workflowSdlcEngineFactory = workflowSdlcEngineFactory;
    this.#workflowSdlcActionDefinitionCrudService =
      workflowSdlcActionDefinitionCrudService;
  }

  make() {
    return this.#inngest.createFunction(
      { id: SDLC_WORKFLOW_FUNCTION_ID },
      { event: SDLC_WORKFLOW_INIT_EVENT },
      async (payload) => {
        const workflowActionDefinitionsResult =
          await this.#workflowSdlcActionDefinitionCrudService.list();

        if (workflowActionDefinitionsResult.isErr()) {
          return workflowActionDefinitionsResult;
        }
        const workflowEngine = await this.#workflowSdlcEngineFactory.make({
          workflowActionDefinitions: workflowActionDefinitionsResult.value,
        });

        await workflowEngine.run(payload);
      },
    );
  }
}

export { WorkflowSdlcFunctionFactory };
