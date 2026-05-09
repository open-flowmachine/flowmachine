import type { WorkflowExecution } from "@/module/workflow/workflow-execution-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/tenant/tenant-model";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const workflowExecutionRepository = makeMongoRepository<
  WorkflowExecution,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "workflow-execution",
  isTenantAware: true,
});

export { workflowExecutionRepository };
