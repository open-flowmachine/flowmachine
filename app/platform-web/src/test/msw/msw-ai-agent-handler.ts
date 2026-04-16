import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

import { getEnv } from "@/lib/env/env";
import { makeBaseMswHandler } from "@/test/msw/msw-util";

const BASE_URL = `${getEnv().NEXT_PUBLIC_SERVICE_BASE_URL}/api/v1/ai-agent`;

const makeAiAgentMswHandler = () => ({
  list: makeBaseMswHandler<AiAgent[]>({ method: "get", url: BASE_URL }),
  getById: makeBaseMswHandler<AiAgent>({
    method: "get",
    url: `${BASE_URL}/:id`,
  }),
  deleteById: makeBaseMswHandler({ method: "delete", url: `${BASE_URL}/:id` }),
  create: makeBaseMswHandler({ method: "post", url: BASE_URL }),
  updateById: makeBaseMswHandler({ method: "patch", url: `${BASE_URL}/:id` }),
});

export { makeAiAgentMswHandler };
