"use server";

import type { UpdateGitRepositoryServicePortIn } from "@/core/port/git-repository/service-port";
import { makeGitRepositoryHttpClient } from "@/infra/http-client/git-repository/git-repository-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const updateGitRepository = async (
  input: UpdateGitRepositoryServicePortIn,
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeGitRepositoryHttpClient({ httpClient });
  await client.updateById({
    payload: { id: input.params.id, body: input.body },
  });
};
