import { makeTenantAwareMongoRepository } from "@/lib/mongo/mongo-repository";

const projectRepository = makeTenantAwareMongoRepository({
  collectionName: "project",
});

export { projectRepository };
