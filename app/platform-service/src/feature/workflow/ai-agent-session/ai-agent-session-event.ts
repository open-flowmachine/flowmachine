import z from "zod";

import {
  AI_AGENT_SESSION_INITIALIZATION_REQUESTED_EVENT,
  AI_AGENT_SESSION_INITIALIZED_EVENT,
  AI_AGENT_SESSION_USER_INPUT_RECEIVED_EVENT,
} from "@/feature/workflow/ai-agent-session/ai-agent-session-constant";
import { aiAgentSessionModes } from "@/feature/workflow/ai-agent-session/ai-agent-session-type";
import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/tenant/tenant-model";
import { makeInngestEventType } from "@/vendor/inngest/inngest-util";

const aiAgentSessionInitializationRequestEvent = makeInngestEventType({
  name: AI_AGENT_SESSION_INITIALIZATION_REQUESTED_EVENT,
  dataSchema: z.object({
    tenant: tenantSchema,
    aiAgentId: idSchema,
    aiAgentRunId: idSchema.nullable(),
    aiAgentSessionMode: z.enum(aiAgentSessionModes),
  }),
});

const aiAgentSessionInitializedEvent = makeInngestEventType({
  name: AI_AGENT_SESSION_INITIALIZED_EVENT,
  dataSchema: z.object({
    tenant: tenantSchema,
    aiAgentId: idSchema,
    aiAgentRunId: idSchema,
    aiAgentSessionMode: z.enum(aiAgentSessionModes),
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
