import type { HttpClient } from "@/lib/http/http-client";
import { type HttpEnvelope } from "@/lib/http/http-schema";
import type {
  HttpClientCreateProjectInput,
  HttpClientDeleteProjectInput,
  HttpClientGetProjectInput,
  HttpClientSyncProjectInput,
  HttpClientUpdateProjectInput,
  Project,
} from "@/module/project/project-type";

const BASE_PATH = "/api/v1/project";

const makeProjectHttpClient = (input: { httpClient: HttpClient }) => {
  const { httpClient } = input;

  return {
    create: async ({ body }: HttpClientCreateProjectInput) => {
      const response = await httpClient.post<HttpEnvelope>(BASE_PATH, body);
      return response.data;
    },

    deleteById: async ({ params }: HttpClientDeleteProjectInput) => {
      const response = await httpClient.delete<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    getById: async ({ params }: HttpClientGetProjectInput) => {
      const response = await httpClient.get<HttpEnvelope<Project>>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    list: async () => {
      const response = await httpClient.get<HttpEnvelope<Project[]>>(BASE_PATH);
      return response.data;
    },

    syncById: async ({ params }: HttpClientSyncProjectInput) => {
      const response = await httpClient.post<HttpEnvelope>(
        `${BASE_PATH}/${params.id}/sync`,
      );
      return response.data;
    },

    updateById: async ({ body, params }: HttpClientUpdateProjectInput) => {
      const response = await httpClient.patch<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
        body,
      );
      return response.data;
    },
  };
};

export { makeProjectHttpClient };
