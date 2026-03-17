import { noop } from "es-toolkit";
import { z } from "zod/v4";
import { projectDomainSchema } from "@/core/domain/project/entity";
import { projectHttpResponseDtoSchema } from "@/infra/http-client/project/project-http-client-dto";

export const projectDomainCodec = z.codec(
  projectHttpResponseDtoSchema,
  projectDomainSchema,
  {
    decode: (dto) => ({
      id: dto.id,
      tenant: dto.tenant,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      name: dto.name,
      integration: dto.integration,
    }),
    encode: noop as () => never,
  },
);
