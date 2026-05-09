import type { Credential } from "@/module/credential/credential-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/tenant/tenant-model";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const credentialRepository = makeMongoRepository<
  Credential,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "credential",
  isTenantAware: true,
});

export { credentialRepository };
