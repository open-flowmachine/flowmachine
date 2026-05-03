import z from "zod";

import { aiAgentRunMessageRoles } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import { dateTimeSchema } from "@/shared/model/model";
import { idSchema } from "@/shared/model/model-id";

const aiAgentRunMessageResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  aiAgentRunId: idSchema,
  role: z.enum(aiAgentRunMessageRoles),
  content: z.string(),
  toolName: z.string().nullable(),
  toolInput: z.record(z.string(), z.unknown()).nullable(),
  toolResult: z.record(z.string(), z.unknown()).nullable(),
});
type AiAgentRunMessageResponseDto = z.infer<
  typeof aiAgentRunMessageResponseDtoSchema
>;

const postAiAgentRunMessageRequestBodyDtoSchema = z.object({
  role: z.enum(aiAgentRunMessageRoles),
  content: z.string(),
  toolName: z.string().nullable().optional(),
  toolInput: z.record(z.string(), z.unknown()).nullable().optional(),
  toolResult: z.record(z.string(), z.unknown()).nullable().optional(),
});

const listAiAgentRunMessagesRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
  aiAgentRunId: idSchema,
});

export {
  aiAgentRunMessageResponseDtoSchema,
  listAiAgentRunMessagesRequestParamsDtoSchema,
  postAiAgentRunMessageRequestBodyDtoSchema,
};
export type { AiAgentRunMessageResponseDto };
