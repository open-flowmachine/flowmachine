import { z } from "zod/v4";
import { withHttpEnvelopeSchema } from "@/backend/http-client/shared-http-client-schema";
import { projectDomainSchema } from "@/domain/entity/project/project-domain-schema";
import type {
  CreateProjectServicePortIn,
  DeleteProjectServicePortIn,
  GetProjectServicePortIn,
  SyncProjectServicePortIn,
  UpdateProjectServicePortIn,
} from "@/domain/port/project/project-service-port";
import type { HttpClient } from "@/lib/http/http-client";

const BASE_PATH = "/api/v1/project";

type MakeProjectHttpClientIn = {
  httpClient: HttpClient;
};

export const makeProjectHttpClient = ({
  httpClient,
}: MakeProjectHttpClientIn) => ({
  create: async ({ body }: CreateProjectServicePortIn) => {
    const response = await httpClient.post(BASE_PATH, body);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  deleteById: async ({ params }: DeleteProjectServicePortIn) => {
    const response = await httpClient.delete(`${BASE_PATH}/${params.id}`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  getById: async ({ params }: GetProjectServicePortIn) => {
    const response = await httpClient.get(`${BASE_PATH}/${params.id}`);
    const schema = withHttpEnvelopeSchema(projectDomainSchema);
    return schema.parse(response.data);
  },

  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(projectDomainSchema.array());
    return schema.parse(response.data);
  },

  syncById: async ({ params }: SyncProjectServicePortIn) => {
    const response = await httpClient.post(`${BASE_PATH}/${params.id}/sync`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  updateById: async ({ body, params }: UpdateProjectServicePortIn) => {
    await httpClient.patch(`${BASE_PATH}/${params.id}`, body);
  },
});
