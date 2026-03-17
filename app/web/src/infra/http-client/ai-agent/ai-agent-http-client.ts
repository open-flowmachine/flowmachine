import { z } from "zod/v4";
import type { HttpClient } from "@/core/http/http-client";
import {
  type CreateAiAgentHttpClientIn,
  type DeleteAiAgentClientIn,
  type GetAiAgentByIdClientIn,
  type UpdateAiAgentHttpClientIn,
  aiAgentHttpResponseDtoSchema,
} from "@/infra/http-client/ai-agent/ai-agent-http-client-dto";
import { withHttpEnvelopeSchema } from "@/infra/http-client/shared/http-envelope-schema";

const BASE_PATH = "/api/v1/ai-agent";

type MakeAiAgentHttpClientIn = {
  httpClient: HttpClient;
};

export const makeAiAgentHttpClient = ({
  httpClient,
}: MakeAiAgentHttpClientIn) => ({
  create: async ({ payload }: CreateAiAgentHttpClientIn) => {
    const response = await httpClient.post(BASE_PATH, payload);
    const schema = withHttpEnvelopeSchema(aiAgentHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  deleteById: async ({ payload }: DeleteAiAgentClientIn) => {
    const response = await httpClient.delete(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  getById: async ({ payload }: GetAiAgentByIdClientIn) => {
    const response = await httpClient.get(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(aiAgentHttpResponseDtoSchema);
    return schema.parse(response.data);
  },

  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(aiAgentHttpResponseDtoSchema.array());
    return schema.parse(response.data);
  },

  updateById: async ({ payload }: UpdateAiAgentHttpClientIn) => {
    await httpClient.patch(`${BASE_PATH}/${payload.id}`, payload.body);
  },
});

export type AiAgentHttpClient = ReturnType<typeof makeAiAgentHttpClient>;
