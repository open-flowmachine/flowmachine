import type { Credential } from "@/module/credential/credential-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const credentialRepository = makeTenantAwareMongoRepository<Credential>({
  collectionName: "credential",
});

export { credentialRepository };
