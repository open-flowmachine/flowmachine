import type { WorkflowExecution } from "@/module/workflow/workflow-execution-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const workflowExecutionRepository =
  makeTenantAwareMongoRepository<WorkflowExecution>({
    collectionName: "workflow-execution",
  });

export { workflowExecutionRepository };
