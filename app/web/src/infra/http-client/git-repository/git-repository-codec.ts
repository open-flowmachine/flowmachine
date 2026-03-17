import { noop } from "es-toolkit";
import { z } from "zod/v4";
import { gitRepositoryDomainSchema } from "@/core/domain/git-repository/entity";
import { gitRepositoryHttpResponseDtoSchema } from "@/infra/http-client/git-repository/git-repository-http-client-dto";

export const gitRepositoryDomainCodec = z.codec(
  gitRepositoryHttpResponseDtoSchema,
  gitRepositoryDomainSchema,
  {
    decode: (dto) => ({
      id: dto.id,
      tenant: dto.tenant,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      name: dto.name,
      url: dto.url,
      config: dto.config,
      integration: dto.integration,
      projects: dto.projects,
    }),
    encode: noop as () => never,
  },
);
