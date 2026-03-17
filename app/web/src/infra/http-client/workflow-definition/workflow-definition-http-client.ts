import { z } from "zod/v4";
import type { HttpClient } from "@/core/http/http-client";
import { withHttpEnvelopeSchema } from "@/infra/http-client/shared/http-envelope-schema";
import {
  type CreateWorkflowDefinitionHttpClientIn,
  type DeleteWorkflowDefinitionClientIn,
  type GetWorkflowDefinitionByIdClientIn,
  type UpdateWorkflowDefinitionHttpClientIn,
  workflowDefinitionHttpResponseDtoSchema,
} from "@/infra/http-client/workflow-definition/workflow-definition-http-client-dto";

const BASE_PATH = "/api/v1/workflow-definition";

type MakeWorkflowDefinitionHttpClientIn = {
  httpClient: HttpClient;
};

export const makeWorkflowDefinitionHttpClient = ({
  httpClient,
}: MakeWorkflowDefinitionHttpClientIn) => ({
  create: async ({ payload }: CreateWorkflowDefinitionHttpClientIn) => {
    const response = await httpClient.post(BASE_PATH, payload);
    const schema = withHttpEnvelopeSchema(
      workflowDefinitionHttpResponseDtoSchema,
    );
    return schema.parse(response.data);
  },

  deleteById: async ({ payload }: DeleteWorkflowDefinitionClientIn) => {
    const response = await httpClient.delete(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(z.void());
    return schema.parse(response.data);
  },

  getById: async ({ payload }: GetWorkflowDefinitionByIdClientIn) => {
    const response = await httpClient.get(`${BASE_PATH}/${payload.id}`);
    const schema = withHttpEnvelopeSchema(
      workflowDefinitionHttpResponseDtoSchema,
    );
    return schema.parse(response.data);
  },

  list: async () => {
    const response = await httpClient.get(BASE_PATH);
    const schema = withHttpEnvelopeSchema(
      workflowDefinitionHttpResponseDtoSchema.array(),
    );
    return schema.parse(response.data);
  },

  updateById: async ({ payload }: UpdateWorkflowDefinitionHttpClientIn) => {
    await httpClient.patch(`${BASE_PATH}/${payload.id}`, payload.body);
  },
});

export type WorkflowDefinitionHttpClient = ReturnType<
  typeof makeWorkflowDefinitionHttpClient
>;
