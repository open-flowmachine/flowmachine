"use server";

import { makeCredentialHttpClient } from "@/infra/http-client/credential/credential-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const deleteCredential = async (id: string): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeCredentialHttpClient({ httpClient });
  await client.deleteById({ payload: { id } });
};
