import { z } from "zod/v4";
import { idSchema } from "@/lib/schema";
import { aiModels } from "@/module/ai-agent/ai-agent-type";

export const newAiAgentFormValuesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  model: z.enum(aiModels),
  projects: z.array(idSchema),
});

export type NewAiAgentFormValues = z.infer<typeof newAiAgentFormValuesSchema>;
