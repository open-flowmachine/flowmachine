import type { HttpClient } from "@/lib/http/http-client";
import { type HttpEnvelope } from "@/lib/http/http-schema";
import type {
  GitRepository,
  HttpClientCreateGitRepositoryInput,
  HttpClientDeleteGitRepositoryInput,
  HttpClientGetGitRepositoryInput,
  HttpClientUpdateGitRepositoryInput,
} from "@/module/git-repository/git-repository-type";

const BASE_PATH = "/api/v1/git-repository";

const makeGitRepositoryHttpClient = (input: { httpClient: HttpClient }) => {
  const { httpClient } = input;

  return {
    create: async ({ body }: HttpClientCreateGitRepositoryInput) => {
      const response = await httpClient.post<HttpEnvelope<GitRepository>>(
        BASE_PATH,
        body,
      );
      return response.data;
    },

    deleteById: async ({ params }: HttpClientDeleteGitRepositoryInput) => {
      const response = await httpClient.delete<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    getById: async ({ params }: HttpClientGetGitRepositoryInput) => {
      const response = await httpClient.get<HttpEnvelope<GitRepository>>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    list: async () => {
      const response =
        await httpClient.get<HttpEnvelope<GitRepository[]>>(BASE_PATH);
      return response.data;
    },

    updateById: async ({
      body,
      params,
    }: HttpClientUpdateGitRepositoryInput) => {
      const response = await httpClient.patch<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
        body,
      );
      return response.data;
    },
  };
};

export { makeGitRepositoryHttpClient };
