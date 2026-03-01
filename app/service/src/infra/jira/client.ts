import axios, { type AxiosInstance } from "axios";
import type { CredentialEntity } from "@/core/domain/credential/entity";

type JiraField = {
  id: string;
  name: string;
  custom: boolean;
  schema?: { type: string; custom?: string };
};

type JiraFieldContext = {
  id: string;
  name: string;
  isGlobalContext: boolean;
  projectIds?: string[];
};

type JiraFieldOption = {
  id: string;
  value: string;
  disabled: boolean;
};

class JiraApiClient {
  #client: AxiosInstance;

  private constructor(client: AxiosInstance) {
    this.#client = client;
  }

  static fromCredential(baseUrl: string, credential: CredentialEntity) {
    if (credential.props.type !== "basic") {
      throw new Error(
        `Expected credential type "basic", got "${credential.props.type}"`,
      );
    }
    const { username, password } = credential.props;

    const client = axios.create({
      baseURL: `${baseUrl}/rest/api/3`,
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return new JiraApiClient(client);
  }

  async listFields() {
    const { data } = await this.#client.get<JiraField[]>("/field");
    return data;
  }

  async createField(input: {
    name: string;
    type: string;
    searcherKey: string;
  }) {
    const { data } = await this.#client.post<JiraField>("/field", input);
    return data;
  }

  async getFieldContexts(fieldId: string) {
    const { data } = await this.#client.get<{ values: JiraFieldContext[] }>(
      `/field/${fieldId}/context`,
    );
    return data.values;
  }

  async createFieldContext(
    fieldId: string,
    input: { name: string; projectIds: string[] },
  ) {
    const { data } = await this.#client.post<JiraFieldContext>(
      `/field/${fieldId}/context`,
      input,
    );
    return data;
  }

  async getContextOptions(fieldId: string, contextId: string) {
    const { data } = await this.#client.get<{ values: JiraFieldOption[] }>(
      `/field/${fieldId}/context/${contextId}/option`,
    );
    return data.values;
  }

  async createContextOptions(
    fieldId: string,
    contextId: string,
    options: { value: string; disabled?: boolean }[],
  ) {
    const { data } = await this.#client.post<{ options: JiraFieldOption[] }>(
      `/field/${fieldId}/context/${contextId}/option`,
      { options },
    );
    return data;
  }

  async updateContextOptions(
    fieldId: string,
    contextId: string,
    options: { id: string; value: string; disabled?: boolean }[],
  ) {
    const { data } = await this.#client.put<{ options: JiraFieldOption[] }>(
      `/field/${fieldId}/context/${contextId}/option`,
      { options },
    );
    return data;
  }
}

export {
  JiraApiClient,
  type JiraField,
  type JiraFieldContext,
  type JiraFieldOption,
};
