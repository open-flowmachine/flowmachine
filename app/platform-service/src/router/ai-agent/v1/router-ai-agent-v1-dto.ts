import z from "zod";

import { aiModels } from "@/module/ai-agent/ai-agent-model";
import { dateTimeSchema } from "@/shared/model/model";
import { idSchema } from "@/shared/model/model-id";

const aiAgentProjectSchema = z.object({
  id: idSchema,
});

const aiAgentResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
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

export {
  aiAgentResponseDtoSchema,
  deleteAiAgentRequestParamsDtoSchema,
  patchAiAgentRequestBodyDtoSchema,
  patchAiAgentRequestParamsDtoSchema,
  postAiAgentRequestBodyDtoSchema,
};
export type { AiAgentResponseDto };
