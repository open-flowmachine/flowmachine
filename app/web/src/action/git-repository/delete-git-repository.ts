"use server";

import { makeGitRepositoryHttpClient } from "@/infra/http-client/git-repository/git-repository-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const deleteGitRepository = async (id: string): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeGitRepositoryHttpClient({ httpClient });
  await client.deleteById({ payload: { id } });
};
