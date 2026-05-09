import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type {
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/tenant/tenant-model";

import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

const aiAgentRunMessageRepository = makeMongoRepository<
  AiAgentRunMessage,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "ai-agent-run-message",
  collectionIndexes: [{ key: { aiAgentRunId: 1, createdAt: 1 } }],
  isTenantAware: true,
});

export { aiAgentRunMessageRepository };
