import { Engine, type EngineAction } from "@inngest/workflow-kit";
import z from "zod";
import { entityIdSchema } from "@/core/domain/entity";
import { tenantSchema } from "@/core/domain/tenant-aware-entity";
import type { WorkflowActionDefinitionEntity } from "@/core/domain/workflow/definition/action/entity";
import type { WorkflowDefinitionCrudService } from "@/core/domain/workflow/definition/crud-service";

const eventDataSchema = z.object({
  workflowDefinitionId: entityIdSchema,
  tenant: tenantSchema,
});

class WorkflowSdlcEngineFactory {
  #workflowDefinitionCrudService: WorkflowDefinitionCrudService;

  constructor(workflowDefinitionCrudService: WorkflowDefinitionCrudService) {
    this.#workflowDefinitionCrudService = workflowDefinitionCrudService;
  }

  async make(input: {
    workflowActionDefinitions: WorkflowActionDefinitionEntity[];
  }) {
    const { workflowActionDefinitions } = input;

    return new Engine({
      actions: workflowActionDefinitions.map(this.#toEngineAction),
      loader: async (event) => {
        const { workflowDefinitionId, tenant } = eventDataSchema.parse(
          event.data,
        );

        const result = await this.#workflowDefinitionCrudService.get({
          ctx: { tenant },
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

  #toEngineAction(
    workflowActionDefinition: WorkflowActionDefinitionEntity,
  ): EngineAction {
    return {
      kind: workflowActionDefinition.props.kind,
      name: workflowActionDefinition.props.name,
      handler: workflowActionDefinition.props
        .handler as EngineAction["handler"],
    };
  }
}

export { WorkflowSdlcEngineFactory };
