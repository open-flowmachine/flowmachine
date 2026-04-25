import z from "zod";

import { aiModels } from "@/module/ai-agent/ai-agent-model";
import {
  aiAgentRunEndedReasons,
  aiAgentRunStatuses,
} from "@/module/ai-agent-run/ai-agent-run-model";
import { aiAgentRunMessageRoles } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import { idSchema } from "@/shared/model/model-id";

const aiAgentProjectSchema = z.object({
  id: idSchema,
});

const aiAgentResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  model: z.enum(aiModels),
  projects: aiAgentProjectSchema.array(),
});
type AiAgentResponseDto = z.infer<typeof aiAgentResponseDtoSchema>;

const postAiAgentRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(256),
  model: z.enum(aiModels),
  projects: aiAgentProjectSchema.array(),
});

const patchAiAgentRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
});

const patchAiAgentRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  model: z.enum(aiModels).optional(),
  projects: aiAgentProjectSchema.array().optional(),
});

const deleteAiAgentRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
});

const aiAgentRunRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
});

const aiAgentRunWithIdRequestParamsDtoSchema = z.object({
  aiAgentId: idSchema,
  runId: idSchema,
});

const postAiAgentRunRequestBodyDtoSchema = z.object({}).strict();

const aiAgentRunResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  aiAgentId: idSchema,
  status: z.enum(aiAgentRunStatuses),
  sessionId: z.string().nullable(),
  startedAt: z.date(),
  lastMessageAt: z.date().nullable(),
  endedAt: z.date().nullable(),
  endedReason: z.enum(aiAgentRunEndedReasons).nullable(),
});
type AiAgentRunResponseDto = z.infer<typeof aiAgentRunResponseDtoSchema>;

const postAiAgentRunMessageRequestBodyDtoSchema = z.object({
  content: z.string().min(1).max(200_000),
});

const aiAgentRunMessageResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: z.date(),
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

export {
  aiAgentResponseDtoSchema,
  aiAgentRunMessageResponseDtoSchema,
  aiAgentRunRequestParamsDtoSchema,
  aiAgentRunResponseDtoSchema,
  aiAgentRunWithIdRequestParamsDtoSchema,
  deleteAiAgentRequestParamsDtoSchema,
  patchAiAgentRequestBodyDtoSchema,
  patchAiAgentRequestParamsDtoSchema,
  postAiAgentRequestBodyDtoSchema,
  postAiAgentRunMessageRequestBodyDtoSchema,
  postAiAgentRunRequestBodyDtoSchema,
};
export type {
  AiAgentResponseDto,
  AiAgentRunMessageResponseDto,
  AiAgentRunResponseDto,
};
