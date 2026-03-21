import { z } from "zod/v4";
import { idSchema } from "@/lib/schema";
import { aiModels } from "@/module/ai-agent/ai-agent-type";

export const editAiAgentFormValuesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  model: z.enum(aiModels),
  projects: z.array(idSchema),
});

export type EditAiAgentFormValues = z.infer<typeof editAiAgentFormValuesSchema>;
