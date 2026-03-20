import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const aiAgentRepository = makeTenantAwareMongoRepository<AiAgent>({
  collectionName: "ai-agent",
});

export { aiAgentRepository };
