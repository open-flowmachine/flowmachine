import type { GitRepository } from "@/module/git-repository/git-repository-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/model/model-tenant";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const gitRepositoryRepository = makeMongoRepository<
  GitRepository,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "git-repository",
  isTenantAware: true,
});

export { gitRepositoryRepository };
