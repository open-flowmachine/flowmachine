import { z } from "zod/v4";

import { idSchema } from "@/lib/schema";

export const editWorkflowDefinitionFormValuesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  projects: z.array(idSchema),
  isActive: z.boolean(),
  actionsJson: z.string().min(1, "Actions are required"),
  edgesJson: z.string().min(1, "Edges are required"),
});

export type EditWorkflowDefinitionFormValues = z.infer<
  typeof editWorkflowDefinitionFormValuesSchema
>;
