import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";

import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const aiAgentRunRepository = makeTenantAwareMongoRepository<AiAgentRun>({
  collectionName: "ai-agent-run",
  collectionIndexes: [
    { key: { aiAgentId: 1, status: 1 } },
    { key: { aiAgentId: 1, createdAt: -1 } },
  ],
});

export { aiAgentRunRepository };
