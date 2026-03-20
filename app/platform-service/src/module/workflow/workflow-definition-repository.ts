import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const workflowDefinitionRepository =
  makeTenantAwareMongoRepository<WorkflowDefinition>({
    collectionName: "workflow-definition",
  });

export { workflowDefinitionRepository };
