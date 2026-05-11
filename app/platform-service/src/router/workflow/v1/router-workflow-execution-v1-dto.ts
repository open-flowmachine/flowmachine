import z from "zod";

import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/tenant/tenant-model";

const postWorkflowExecutionRequestBodyDtoSchema = z.object({
  tenant: tenantSchema,
  workflowDefinitionId: idSchema,
  aiAgentId: idSchema,
  gitRepositoryId: idSchema,
});

export { postWorkflowExecutionRequestBodyDtoSchema };
