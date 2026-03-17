import { noop } from "es-toolkit";
import { z } from "zod/v4";
import { workflowActionDefinitionDomainSchema } from "@/core/domain/workflow-action-definition/entity";
import { workflowActionDefinitionHttpResponseDtoSchema } from "@/infra/http-client/workflow-action-definition/workflow-action-definition-http-client-dto";

export const workflowActionDefinitionDomainCodec = z.codec(
  workflowActionDefinitionHttpResponseDtoSchema,
  workflowActionDefinitionDomainSchema,
  {
    decode: (dto) => ({
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      kind: dto.kind,
      name: dto.name,
    }),
    encode: noop as () => never,
  },
);
