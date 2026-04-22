import z from "zod";

import { idSchema } from "@/shared/model/model-id";
import { tenantSchema } from "@/shared/model/model-tenant";

const postWorkflowExecutionRequestBodyDtoSchema = z.object({
  tenant: tenantSchema,
  workflowDefinitionId: idSchema,
});

export { postWorkflowExecutionRequestBodyDtoSchema };
