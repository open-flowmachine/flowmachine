"use server";

import type { CredentialDomain } from "@/core/domain/credential/entity";
import { credentialDomainCodec } from "@/infra/http-client/credential/credential-codec";
import { makeCredentialHttpClient } from "@/infra/http-client/credential/credential-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const listCredentials = async (): Promise<CredentialDomain[]> => {
  const httpClient = await makeServerHttpClient();
  const client = makeCredentialHttpClient({ httpClient });
  const response = await client.list();
  return response.data.map((dto) => credentialDomainCodec.decode(dto));
};
