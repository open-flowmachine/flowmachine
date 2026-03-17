import { z } from "zod/v4";
import type { HttpClient } from "@/core/http/http-client";
import {
  type CreateProjectHttpClientIn,
  type DeleteProjectClientIn,
  type GetProjectByIdClientIn,
  type SyncProjectByIdHttpClientIn,
  type UpdateProjectHttpClientIn,
  projectHttpResponseDtoSchema,
} from "@/infra/http-client/project/project-http-client-dto";
import { withHttpEnvelopeSchema } from "@/infra/http-client/shared/http-envelope-schema";

const BASE_PATH = "/api/v1/project";

type MakeProjectHttpClientIn = {
  httpClient: HttpClient;
};

export const makeProjectHttpClient = ({
  httpClient,
}: MakeProjectHttpClientIn) => ({
  create: async ({ payload }: CreateProjectHttpClientIn) => {
    const response = await httpClient.post(BASE_PATH, payload);
    const schema = withHttpEnvelopeSchema(projectHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  deleteById: async ({ payload }: DeleteProjectClientIn) => {
    const response = await httpClient.delete(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  getById: async ({ payload }: GetProjectByIdClientIn) => {
    const response = await httpClient.get(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(projectHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(projectHttpResponseDtoSchema.array());
    return schema.parse(response.data);
  },

  updateById: async ({ payload }: UpdateProjectHttpClientIn) => {
    await httpClient.patch(`${BASE_PATH}/${payload.id}`, payload.body);
  },

  syncById: async ({ payload }: SyncProjectByIdHttpClientIn) => {
    const response = await httpClient.post(`${BASE_PATH}/${payload.id}/sync`);
    const schema = withHttpEnvelopeSchema(projectHttpResponseDtoSchema);
    return schema.parse(response.data);
  },
});

export type ProjectHttpClient = ReturnType<typeof makeProjectHttpClient>;
