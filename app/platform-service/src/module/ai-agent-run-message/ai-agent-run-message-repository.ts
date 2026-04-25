import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";

import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const aiAgentRunMessageRepository =
  makeTenantAwareMongoRepository<AiAgentRunMessage>({
    collectionName: "ai-agent-run-message",
    collectionIndexes: [{ key: { aiAgentRunId: 1, createdAt: 1 } }],
  });

export { aiAgentRunMessageRepository };
