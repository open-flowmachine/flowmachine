import axios from "axios";
import { err, ok } from "neverthrow";
import { mapJiraError } from "@/vendor/jira/jira-err";

type JiraClientConfig = {
  apiKey: string;
  domain: string;
};

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
  async (input: {
    body: {
      name: string;
      type: string;
      searcherKey?: string;
      description?: string;
    };
  }) => {
    try {
      const { data } = await makeHttpClient(config).post<{
        id: string;
        key: string;
        name: string;
        custom: boolean;
        schema?: { type: string; custom?: string };
      }>("/field", input.body);
      return ok(data);
    } catch (error) {
      return err(mapJiraError(error));
    }
  };

const createCustomFieldContextOptions =
  (config: JiraClientConfig) =>
  async (input: {
    params: { fieldId: string; contextId: string };
    body: { options: { value: string; disabled?: boolean }[] };
  }) => {
    try {
      const { data } = await makeHttpClient(config).post<{
        options: { id: string; value: string; disabled: boolean }[];
      }>(
        `/field/${input.params.fieldId}/context/${input.params.contextId}/option`,
        input.body,
      );
      return ok(data);
    } catch (error) {
      return err(mapJiraError(error));
    }
  };

const createCustomFieldAssociations =
  (config: JiraClientConfig) =>
  async (input: {
    body: {
      associationContexts: { type: string; identifier: string }[];
      fields: { type: string; identifier: string }[];
    };
  }) => {
    try {
      await makeHttpClient(config).put("/field/association", input.body);
      return ok(undefined);
    } catch (error) {
      return err(mapJiraError(error));
    }
  };

const getCustomFieldContexts =
  (config: JiraClientConfig) =>
  async (input: { params: { fieldId: string } }) => {
    try {
      const { data } = await makeHttpClient(config).get<{
        values: { id: string }[];
      }>(`/field/${input.params.fieldId}/context`);
      return ok(data);
    } catch (error) {
      return err(mapJiraError(error));
    }
  };

const getProject =
  (config: JiraClientConfig) =>
  async (input: { params: { projectId: string } }) => {
    try {
      const { data } = await makeHttpClient(config).get<{
        id: string;
        key: string;
      }>(`/project/${input.params.projectId}`);
      return ok(data);
    } catch (error) {
      return err(mapJiraError(error));
    }
  };

const deleteField =
  (config: JiraClientConfig) =>
  async (input: { params: { fieldId: string } }) => {
    try {
      await makeHttpClient(config).delete(
        `/field/${input.params.fieldId}`,
      );
      return ok(undefined);
    } catch (error) {
      return err(mapJiraError(error));
    }
  };

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
export type { JiraClient, JiraClientConfig };
