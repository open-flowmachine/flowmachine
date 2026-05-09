import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/tenant/tenant-model";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const projectIssueFieldDefinitionRepository = makeMongoRepository<
  ProjectIssueFieldDefinition,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "project-issue-field-definition",
  isTenantAware: true,
});

export { projectIssueFieldDefinitionRepository };
