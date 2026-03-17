"use server";

import type { ProjectDomain } from "@/core/domain/project/entity";
import { projectDomainCodec } from "@/infra/http-client/project/project-codec";
import { makeProjectHttpClient } from "@/infra/http-client/project/project-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const listProjects = async (): Promise<ProjectDomain[]> => {
  const httpClient = await makeServerHttpClient();
  const client = makeProjectHttpClient({ httpClient });
  const response = await client.list();
  return response.data.map((dto) => projectDomainCodec.decode(dto));
};
