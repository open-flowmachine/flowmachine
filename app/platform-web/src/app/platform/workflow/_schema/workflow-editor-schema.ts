import { z } from "zod/v4";

export const workflowJsonEditorSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().min(1, "Workflow description is required"),
  actions: z
    .object({
      id: z.uuidv7("Action ID must be a valid UUID"),
      kind: z.string().min(1, "Action kind is required"),
      name: z.string().min(1, "Action name is required"),
    })
    .array(),
  edges: z
    .object({
      from: z
        .uuidv7("From Action ID must be a valid UUID")
        .or(z.literal("$source")),
      to: z.uuidv7("To Action ID must be a valid UUID"),
    })
    .array(),
});
