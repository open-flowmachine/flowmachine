import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/model/model-tenant";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const aiAgentRunRepository = makeMongoRepository<
  AiAgentRun,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "ai-agent-run",
  collectionIndexes: [
    { key: { aiAgentId: 1, status: 1 } },
    { key: { aiAgentId: 1, createdAt: -1 } },
  ],
  isTenantAware: true,
});

export { aiAgentRunRepository };
