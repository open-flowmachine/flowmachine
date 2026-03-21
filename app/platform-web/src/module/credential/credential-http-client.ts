import type { HttpClient } from "@/lib/http/http-client";
import { type HttpEnvelope } from "@/lib/http/http-schema";
import type {
  Credential,
  HttpClientCreateCredentialInput,
  HttpClientDeleteCredentialInput,
  HttpClientGetCredentialInput,
  HttpClientUpdateCredentialInput,
} from "@/module/credential/credential-type";

const BASE_PATH = "/api/v1/credential";

const makeCredentialHttpClient = (input: { httpClient: HttpClient }) => {
  const { httpClient } = input;

  return {
    create: async ({ body }: HttpClientCreateCredentialInput) => {
      const response = await httpClient.post<HttpEnvelope>(BASE_PATH, body);
      return response.data;
    },

    deleteById: async ({ params }: HttpClientDeleteCredentialInput) => {
      const response = await httpClient.delete<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    getById: async ({ params }: HttpClientGetCredentialInput) => {
      const response = await httpClient.get<HttpEnvelope<Credential>>(
        `${BASE_PATH}/${params.id}`,
      );
      return response.data;
    },

    list: async () => {
      const response =
        await httpClient.get<HttpEnvelope<Credential[]>>(BASE_PATH);
      return response.data;
    },

    updateById: async ({ body, params }: HttpClientUpdateCredentialInput) => {
      const response = await httpClient.patch<HttpEnvelope>(
        `${BASE_PATH}/${params.id}`,
        body,
      );
      return response.data;
    },
  };
};

export { makeCredentialHttpClient };
