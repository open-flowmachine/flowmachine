import z from "zod";

import {
  aiAgentRunSandboxProviders,
  aiAgentRunStatuses,
} from "@/module/ai-agent-run/ai-agent-run-model";
import { dateTimeSchema } from "@/shared/model/model";
import { idSchema } from "@/shared/model/model-id";

const aiAgentRunSandboxSchema = z.object({
  integration: z.object({
    externalId: z.string(),
    provider: z.enum(aiAgentRunSandboxProviders),
  }),
});

const aiAgentRunResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  aiAgentId: idSchema,
  sandbox: aiAgentRunSandboxSchema.nullable(),
  sessionId: z.string().nullable(),
  status: z.enum(aiAgentRunStatuses),
});
type AiAgentRunResponseDto = z.infer<typeof aiAgentRunResponseDtoSchema>;

const getAiAgentRunRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
  aiAgentRunId: idSchema,
});

const listAiAgentRunsRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
});

export {
  aiAgentRunResponseDtoSchema,
  getAiAgentRunRequestParamsDtoSchema,
  listAiAgentRunsRequestParamsDtoSchema,
};
export type { AiAgentRunResponseDto };
