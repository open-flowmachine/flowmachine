import z from "zod";

import {
  AI_AGENT_SESSION_INITIALIZATION_REQUESTED_EVENT,
  AI_AGENT_SESSION_INITIALIZED_EVENT,
  AI_AGENT_SESSION_USER_INPUT_RECEIVED_EVENT,
} from "@/feature/ai-agent-session/ai-agent-session-constant";
import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";
import { makeInngestEventType } from "@/vendor/inngest/inngest-util";

const aiAgentSessionInitializationRequestEvent = makeInngestEventType({
  name: AI_AGENT_SESSION_INITIALIZATION_REQUESTED_EVENT,
  dataSchema: z.object({
    tenant: tenantSchema,
    aiAgentId: idSchema,
    aiAgentRunId: idSchema.nullable(),
  }),
});

const aiAgentSessionInitializedEvent = makeInngestEventType({
  name: AI_AGENT_SESSION_INITIALIZED_EVENT,
  dataSchema: z.object({
    tenant: tenantSchema,
    aiAgentId: idSchema,
    aiAgentRunId: idSchema,
  }),
});

const aiAgentSessionUserInputReceivedEvent = makeInngestEventType({
  name: AI_AGENT_SESSION_USER_INPUT_RECEIVED_EVENT,
  dataSchema: z.object({
    tenant: tenantSchema,
    aiAgentRunId: idSchema,
    content: z.string(),
  }),
});

export {
  aiAgentSessionInitializationRequestEvent,
  aiAgentSessionInitializedEvent,
  aiAgentSessionUserInputReceivedEvent,
};
