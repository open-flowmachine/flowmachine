import { noop } from "es-toolkit";
import { z } from "zod/v4";
import { credentialDomainSchema } from "@/core/domain/credential/entity";
import { credentialHttpResponseDtoSchema } from "@/infra/http-client/credential/credential-http-client-dto";

const maskSecret = (value: string): string => {
  if (value.length <= 8)
    return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  return `${value.slice(0, 4)}${"\u2022".repeat(value.length - 8)}${value.slice(-4)}`;
};

export const credentialDomainCodec = z.codec(
  credentialHttpResponseDtoSchema,
  credentialDomainSchema,
  {
    decode: (dto) => {
      const base = {
        id: dto.id,
        name: dto.name,
        tenant: dto.tenant,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        expiredAt: dto.expiredAt,
      };

      if (dto.type === "apiKey") {
        return {
          ...base,
          type: "apiKey" as const,
          apiKey: maskSecret(dto.apiKey),
        };
      }

      return {
        ...base,
        type: "basic" as const,
        username: dto.username,
        password: maskSecret(dto.password),
      };
    },
    encode: noop as () => never,
  },
);
