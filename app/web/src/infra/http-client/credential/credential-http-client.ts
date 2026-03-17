import { z } from "zod/v4";
import type { HttpClient } from "@/core/http/http-client";
import {
  type CreateCredentialHttpClientIn,
  type DeleteCredentialClientIn,
  type GetCredentialByIdClientIn,
  type UpdateCredentialHttpClientIn,
  credentialHttpResponseDtoSchema,
} from "@/infra/http-client/credential/credential-http-client-dto";
import { withHttpEnvelopeSchema } from "@/infra/http-client/shared/http-envelope-schema";

const BASE_PATH = "/api/v1/credential";

type MakeCredentialHttpClientIn = {
  httpClient: HttpClient;
};

export const makeCredentialHttpClient = ({
  httpClient,
}: MakeCredentialHttpClientIn) => ({
  create: async ({ payload }: CreateCredentialHttpClientIn) => {
    const response = await httpClient.post(BASE_PATH, payload);
    const schema = withHttpEnvelopeSchema(credentialHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  deleteById: async ({ payload }: DeleteCredentialClientIn) => {
    const response = await httpClient.delete(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  getById: async ({ payload }: GetCredentialByIdClientIn) => {
    const response = await httpClient.get(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(credentialHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(
      credentialHttpResponseDtoSchema.array(),
    );
    return schema.parse(response.data);
  },

  updateById: async ({ payload }: UpdateCredentialHttpClientIn) => {
    await httpClient.patch(`${BASE_PATH}/${payload.id}`, payload.body);
  },
});

export type CredentialHttpClient = ReturnType<typeof makeCredentialHttpClient>;
