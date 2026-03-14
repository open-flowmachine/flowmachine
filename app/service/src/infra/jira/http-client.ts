import axios from "axios";
import { err, ok } from "neverthrow";
import { Err } from "@/common/err/err";

type NewJiraHttpClientInput = {
  apiKey: string;
  domain: string;
};

class JiraHttpClient {
  #apiKey: string;
  #domain: string;

  private constructor(domain: string, apiKey: string) {
    this.#domain = domain;
    this.#apiKey = apiKey;
  }

  static makeNew(input: NewJiraHttpClientInput) {
    const { domain, apiKey } = input;
    return new JiraHttpClient(domain, apiKey);
  }

  async createCustomField({
    body,
  }: {
    body: {
      name: string;
      type: string;
      searcherKey?: string;
      description?: string;
    };
  }) {
    try {
      const { data } = await this.#httpClient().post<{
        id: string;
        key: string;
        name: string;
        custom: boolean;
        schema?: { type: string; custom?: string };
      }>("/field", body);
      return ok(data);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async createCustomFieldContextOptions({
    params,
    body,
  }: {
    params: { fieldId: string; contextId: string };
    body: { options: { value: string; disabled?: boolean }[] };
  }) {
    try {
      const { data } = await this.#httpClient().post<{
        options: { id: string; value: string; disabled: boolean }[];
      }>(`/field/${params.fieldId}/context/${params.contextId}/option`, body);
      return ok(data);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async createCustomFieldAssociations({
    body,
  }: {
    body: {
      associationContexts: { type: string; identifier: string }[];
      fields: { type: string; identifier: string }[];
    };
  }) {
    try {
      await this.#httpClient().put("/field/association", body);
      return ok(undefined);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async deleteField({ params }: { params: { fieldId: string } }) {
    try {
      await this.#httpClient().delete(`/field/${params.fieldId}`);
      return ok(undefined);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async getCustomFieldContexts({ params }: { params: { fieldId: string } }) {
    try {
      const { data } = await this.#httpClient().get<{
        values: { id: string }[];
      }>(`/field/${params.fieldId}/context`);
      return ok(data);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async getProject({ params }: { params: { projectId: string } }) {
    try {
      const { data } = await this.#httpClient().get<{
        id: string;
        key: string;
      }>(`/project/${params.projectId}`);
      return ok(data);
    } catch (error) {
      return err(Err.from(error));
    }
  }

  #httpClient() {
    return axios.create({
      baseURL: `https://${this.#domain}.atlassian.net/rest/api/3`,
      headers: {
        Authorization: `Basic ${this.#apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }
}

export { JiraHttpClient };
