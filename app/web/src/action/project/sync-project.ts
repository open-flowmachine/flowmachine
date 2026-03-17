"use server";

import { makeProjectHttpClient } from "@/infra/http-client/project/project-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const syncProject = async (id: string): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeProjectHttpClient({ httpClient });
  await client.syncById({ payload: { id } });
};
