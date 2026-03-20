import type { GitRepository } from "@/module/git-repository/git-repository-model";
import type { Id } from "@/shared/model/model-id";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const gitRepositoryRepository = makeTenantAwareMongoRepository<
  GitRepository,
  { "projects.id": Id }
>({
  collectionName: "git-repository",
});

export { gitRepositoryRepository };
