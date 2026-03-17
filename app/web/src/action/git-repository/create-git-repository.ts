"use server";

import type { CreateGitRepositoryServicePortIn } from "@/core/port/git-repository/service-port";
import { makeGitRepositoryHttpClient } from "@/infra/http-client/git-repository/git-repository-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const createGitRepository = async (
  input: CreateGitRepositoryServicePortIn["body"],
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeGitRepositoryHttpClient({ httpClient });
  await client.create({ payload: input });
};
