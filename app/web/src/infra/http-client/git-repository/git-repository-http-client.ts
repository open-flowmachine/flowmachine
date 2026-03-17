import { z } from "zod/v4";
import type { HttpClient } from "@/core/http/http-client";
import {
  type CreateGitRepositoryHttpClientIn,
  type DeleteGitRepositoryClientIn,
  type GetGitRepositoryByIdClientIn,
  type UpdateGitRepositoryHttpClientIn,
  gitRepositoryHttpResponseDtoSchema,
} from "@/infra/http-client/git-repository/git-repository-http-client-dto";
import { withHttpEnvelopeSchema } from "@/infra/http-client/shared/http-envelope-schema";

const BASE_PATH = "/api/v1/git-repository";

type MakeGitRepositoryHttpClientIn = {
  httpClient: HttpClient;
};

export const makeGitRepositoryHttpClient = ({
  httpClient,
}: MakeGitRepositoryHttpClientIn) => ({
  create: async ({ payload }: CreateGitRepositoryHttpClientIn) => {
    const response = await httpClient.post(BASE_PATH, payload);
    const schema = withHttpEnvelopeSchema(gitRepositoryHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  deleteById: async ({ payload }: DeleteGitRepositoryClientIn) => {
    const response = await httpClient.delete(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  getById: async ({ payload }: GetGitRepositoryByIdClientIn) => {
    const response = await httpClient.get(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(gitRepositoryHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(
      gitRepositoryHttpResponseDtoSchema.array(),
    );
    return schema.parse(response.data);
  },

  updateById: async ({ payload }: UpdateGitRepositoryHttpClientIn) => {
    await httpClient.patch(`${BASE_PATH}/${payload.id}`, payload.body);
  },
});

export type GitRepositoryHttpClient = ReturnType<
  typeof makeGitRepositoryHttpClient
>;
