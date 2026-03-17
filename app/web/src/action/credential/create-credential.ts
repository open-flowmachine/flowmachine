"use server";

import type { CreateCredentialServicePortIn } from "@/core/port/credential/service-port";
import { makeCredentialHttpClient } from "@/infra/http-client/credential/credential-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const createCredential = async (
  input: CreateCredentialServicePortIn["body"],
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeCredentialHttpClient({ httpClient });
  await client.create({ payload: input });
};
