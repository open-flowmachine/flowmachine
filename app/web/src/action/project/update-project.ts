"use server";

import type { UpdateProjectServicePortIn } from "@/core/port/project/service-port";
import { makeProjectHttpClient } from "@/infra/http-client/project/project-http-client";
import { makeServerHttpClient } from "@/infra/http-client/shared/make-server-http-client";

export const updateProject = async (
  input: UpdateProjectServicePortIn,
): Promise<void> => {
  const httpClient = await makeServerHttpClient();
  const client = makeProjectHttpClient({ httpClient });
  await client.updateById({
    payload: { id: input.params.id, body: input.body },
  });
};
