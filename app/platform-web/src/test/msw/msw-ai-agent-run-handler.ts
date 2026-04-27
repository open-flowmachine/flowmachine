import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";
import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-type";

import { getEnv } from "@/lib/env/env";
import { makeBaseMswHandler } from "@/test/msw/msw-util";

const RUN_BASE = `${getEnv().NEXT_PUBLIC_SERVICE_BASE_URL}/api/v1/ai-agent/:aiAgentId/run`;
const RUN_DETAIL = `${RUN_BASE}/:runId`;

const makeAiAgentRunMswHandler = () => ({
  list: makeBaseMswHandler<AiAgentRun[]>({ method: "get", url: RUN_BASE }),
  create: makeBaseMswHandler<{ runId: string }>({
    method: "post",
    url: RUN_BASE,
  }),
  getById: makeBaseMswHandler<AiAgentRun>({ method: "get", url: RUN_DETAIL }),
  stop: makeBaseMswHandler({ method: "post", url: `${RUN_DETAIL}/stop` }),
  listMessages: makeBaseMswHandler<AiAgentRunMessage[]>({
    method: "get",
    url: `${RUN_DETAIL}/message`,
  }),
  sendMessage: makeBaseMswHandler<{ messageId: string }>({
    method: "post",
    url: `${RUN_DETAIL}/message`,
  }),
});

export { makeAiAgentRunMswHandler };
