"use server";

import type { GitRepositoryDomain } from "@/core/domain/git-repository/entity";
import { gitRepositoryDomainCodec } from "@/infra/http-client/git-repository/git-repository-codec";
import { makeGitRepositoryHttpClient } from "@/infra/http-client/git-repository/git-repository-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const listGitRepositories = async (): Promise<GitRepositoryDomain[]> => {
  const httpClient = await makeServerHttpClient();
  const client = makeGitRepositoryHttpClient({ httpClient });
  const response = await client.list();
  return response.data.map((dto) => gitRepositoryDomainCodec.decode(dto));
};
