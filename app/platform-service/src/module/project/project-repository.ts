import type { Project } from "@/module/project/project-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const projectRepository = makeTenantAwareMongoRepository<Project>({
  collectionName: "project",
});

export { projectRepository };
