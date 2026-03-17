"use server";

import type { CredentialDomain } from "@/core/domain/credential/entity";
import { credentialDomainCodec } from "@/infra/http-client/credential/credential-codec";
import { makeCredentialHttpClient } from "@/infra/http-client/credential/credential-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const getCredential = async (id: string): Promise<CredentialDomain> => {
  const httpClient = await makeServerHttpClient();
  const client = makeCredentialHttpClient({ httpClient });
  const response = await client.getById({ payload: { id } });
  return credentialDomainCodec.decode(response.data);
};
