import { z } from "zod/v4";
import { baseHttpClientResponseDtoSchema } from "@/infra/http-client/shared/http-envelope-schema";

export const workflowActionDefinitionHttpResponseDtoSchema = z.object({
  ...baseHttpClientResponseDtoSchema.shape,
  kind: z.string(),
  name: z.string(),
});
export type WorkflowActionDefinitionHttpResponseDto = z.output<
  typeof workflowActionDefinitionHttpResponseDtoSchema
>;
