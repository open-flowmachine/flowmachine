import axios from "axios";

import type { JiraClientConfig } from "@/vendor/jira/jira-type";

import { safeFn } from "@/shared/err/err-util";
import { mapJiraError } from "@/vendor/jira/jira-mapper";

const makeHttpClient = (config: JiraClientConfig) =>
  axios.create({
    baseURL: `https://${config.domain}.atlassian.net/rest/api/3`,
    headers: {
      Authorization: `Basic ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

const createCustomField =
  (config: JiraClientConfig) =>
  (input: {
    body: {
      name: string;
      type: string;
      searcherKey?: string;
      description?: string;
    };
  }) =>
    safeFn(async () => {
      const { data } = await makeHttpClient(config).post<{
        id: string;
        key: string;
        name: string;
        custom: boolean;
        schema?: { type: string; custom?: string };
      }>("/field", input.body);
      return data;
    }, mapJiraError);

const createCustomFieldContextOptions =
  (config: JiraClientConfig) =>
  (input: {
    params: { fieldId: string; contextId: string };
    body: { options: { value: string; disabled?: boolean }[] };
  }) =>
    safeFn(async () => {
      const { data } = await makeHttpClient(config).post<{
        options: { id: string; value: string; disabled: boolean }[];
      }>(
        `/field/${input.params.fieldId}/context/${input.params.contextId}/option`,
        input.body,
      );
      return data;
    }, mapJiraError);

const createCustomFieldAssociations =
  (config: JiraClientConfig) =>
  (input: {
    body: {
      associationContexts: { type: string; identifier: string }[];
      fields: { type: string; identifier: string }[];
    };
  }) =>
    safeFn(async () => {
      await makeHttpClient(config).put("/field/association", input.body);
    }, mapJiraError);

const getCustomFieldContexts =
  (config: JiraClientConfig) => (input: { params: { fieldId: string } }) =>
    safeFn(async () => {
      const { data } = await makeHttpClient(config).get<{
        values: { id: string }[];
      }>(`/field/${input.params.fieldId}/context`);
      return data;
    }, mapJiraError);

const getProject =
  (config: JiraClientConfig) => (input: { params: { projectId: string } }) =>
    safeFn(async () => {
      const { data } = await makeHttpClient(config).get<{
        id: string;
        key: string;
      }>(`/project/${input.params.projectId}`);
      return data;
    }, mapJiraError);

const deleteField =
  (config: JiraClientConfig) => (input: { params: { fieldId: string } }) =>
    safeFn(async () => {
      await makeHttpClient(config).delete(`/field/${input.params.fieldId}`);
    }, mapJiraError);

const makeJiraClient = (config: JiraClientConfig) => ({
  createCustomField: createCustomField(config),
  createCustomFieldContextOptions: createCustomFieldContextOptions(config),
  createCustomFieldAssociations: createCustomFieldAssociations(config),
  getCustomFieldContexts: getCustomFieldContexts(config),
  getProject: getProject(config),
  deleteField: deleteField(config),
});

type JiraClient = ReturnType<typeof makeJiraClient>;

export { makeJiraClient };
export type { JiraClient };
