import { Engine, type EngineAction } from "@inngest/workflow-kit";
import type z from "zod";
import type { Tenant } from "@/core/domain/tenant-aware-entity";
import type { WorkflowActionDefinitionEntity } from "@/core/domain/workflow/definition/action/entity";
import type { WorkflowDefinitionCrudService } from "@/core/domain/workflow/definition/crud-service";
import type {
  WorkflowEngineFactory,
  workflowEngineFactoryInputSchema,
} from "@/core/infra/workflow/engine/factory";
import type { WorkflowEngine } from "@/core/infra/workflow/engine/type";

class InngestWorkflowEngineFactory implements WorkflowEngineFactory {
  #workflowDefinitionCrudService: WorkflowDefinitionCrudService;

  constructor(workflowDefinitionCrudService: WorkflowDefinitionCrudService) {
    this.#workflowDefinitionCrudService = workflowDefinitionCrudService;
  }

  async make(
    input: z.infer<typeof workflowEngineFactoryInputSchema.make>,
  ): Promise<WorkflowEngine> {
    const { workflowActionDefinitions } = input;

    return new Engine({
      actions: workflowActionDefinitions.map(
        this.#toInngestWorkflowActionDefinition,
      ),
      loader: async (event) => {
        const { workflowDefinitionId, tenant } = event.data as {
          workflowDefinitionId: string;
          tenant: Tenant;
        };

        const result = await this.#workflowDefinitionCrudService.get({
          ctx: {
            tenant,
          },
          payload: { id: workflowDefinitionId },
        });

        if (result.isErr()) {
          return null;
        }
        const workflow = result.value;

        return {
          name: workflow.props.name,
          description: workflow.props.description,
          actions: workflow.props.actions,
          edges: workflow.props.edges,
        };
      },
    });
  }

  #toInngestWorkflowActionDefinition(
    workflowActionDefinition: WorkflowActionDefinitionEntity,
  ) {
    return {
      kind: workflowActionDefinition.props.kind,
      name: workflowActionDefinition.props.name,
      handler: workflowActionDefinition.props.handler,
    } satisfies EngineAction;
  }
}

export { InngestWorkflowEngineFactory };
