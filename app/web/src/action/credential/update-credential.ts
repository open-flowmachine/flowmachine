"use server";

import type { UpdateCredentialServicePortIn } from "@/core/port/credential/service-port";
import { makeCredentialHttpClient } from "@/infra/http-client/credential/credential-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const updateCredential = async (
  input: UpdateCredentialServicePortIn,
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeCredentialHttpClient({ httpClient });
  await client.updateById({
    payload: { id: input.params.id, body: input.body },
  });
};
