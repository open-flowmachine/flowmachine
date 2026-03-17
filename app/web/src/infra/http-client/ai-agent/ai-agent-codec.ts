import { noop } from "es-toolkit";
import { z } from "zod/v4";
import { aiAgentDomainSchema } from "@/core/domain/ai-agent/entity";
import { aiAgentHttpResponseDtoSchema } from "@/infra/http-client/ai-agent/ai-agent-http-client-dto";

export const aiAgentDomainCodec = z.codec(
  aiAgentHttpResponseDtoSchema,
  aiAgentDomainSchema,
  {
    decode: (dto) => ({
      id: dto.id,
      tenant: dto.tenant,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      model: dto.model,
      name: dto.name,
      projects: dto.projects,
    }),
    encode: noop as () => never,
  },
);
