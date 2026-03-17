"use server";

import type { CreateProjectServicePortIn } from "@/core/port/project/service-port";
import { makeProjectHttpClient } from "@/infra/http-client/project/project-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const createProject = async (
  input: CreateProjectServicePortIn["body"],
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeProjectHttpClient({ httpClient });
  await client.create({ payload: input });
};
