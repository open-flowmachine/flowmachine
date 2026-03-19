import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const projectRepository = makeTenantAwareMongoRepository({
  collectionName: "project",
});

export { projectRepository };
