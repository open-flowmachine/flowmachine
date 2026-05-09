import type { Project } from "@/module/project/project-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/model/model-tenant";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const projectRepository = makeMongoRepository<
  Project,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "project",
  isTenantAware: true,
});

export { projectRepository };
