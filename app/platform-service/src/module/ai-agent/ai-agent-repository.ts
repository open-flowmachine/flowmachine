import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/tenant/tenant-model";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const aiAgentRepository = makeMongoRepository<
  AiAgent,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "ai-agent",
  isTenantAware: true,
});

export { aiAgentRepository };
