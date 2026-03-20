import type { GitRepository } from "@/module/git-repository/git-repository-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const gitRepositoryRepository = makeTenantAwareMongoRepository<GitRepository>({
  collectionName: "git-repository",
});

export { gitRepositoryRepository };
