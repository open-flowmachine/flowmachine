import { Engine } from "@inngest/workflow-kit";
import z from "zod";
import { workflowActionDefinitions } from "@/feature/workflow/workflow-action-definition";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
import { baseLog } from "@/vendor/pino/pino-log";

const eventDataSchema = z.object({
  workflowDefinitionId: idSchema,
  tenant: tenantSchema,
});

const log = baseLog.child({ context: "workflow-engine" });
const workflowDefinitionService = makeWorkflowDefinitionService();

const workflowEngine = new Engine({
  actions: workflowActionDefinitions,
  loader: async (event) => {
    const validateResult = validate(eventDataSchema, event.data);

    if (validateResult.isErr()) {
      log.error(
        {
          error: validateResult.error,
          eventData: event.data,
        },
        "Invalid event data",
      );
      return null;
    }
    const { workflowDefinitionId, tenant } = validateResult.value;

    const result = await workflowDefinitionService.get({
      ctx: {
        tenant,
      },
      id: workflowDefinitionId,
    });

    if (result.isErr()) {
      log.error(
        {
          error: result.error,
        },
        "Failed to load workflow definition",
      );
      return null;
    }
    const workflow = result.value.data;

    return {
      name: workflow.name,
      description: workflow.description,
      actions: workflow.actions,
      edges: workflow.edges,
    };
  },
});

export { workflowEngine };
