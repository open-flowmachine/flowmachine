import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/tenant/tenant-model";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const workflowDefinitionRepository = makeMongoRepository<
  WorkflowDefinition,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "workflow-definition",
  isTenantAware: true,
});

export { workflowDefinitionRepository };
