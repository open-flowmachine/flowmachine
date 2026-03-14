import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import { Err } from "@/common/err/err";
import type { ExternalProjectService } from "@/core/infra/external/project/service";
import { JiraHttpClient } from "@/infra/jira/http-client";

class JiraExternalProjectService implements ExternalProjectService {
  async createCustomIssueField(
    input: Parameters<ExternalProjectService["createCustomIssueField"]>[0],
  ) {
    const { credential, project, projectIssueFieldDefinition } = input;

    if (isNil(project.props.integration)) {
      return err(Err.code("badRequest"));
    }
    if (credential.props.type !== "basic") {
      return err(Err.code("badRequest"));
    }

    const jiraHttpCient = JiraHttpClient.makeNew({
      apiKey: btoa(`${credential.props.username}:${credential.props.password}`),
      domain: project.props.integration.domain,
    });

    const createCustomFieldResult = await jiraHttpCient.createCustomField({
      body: {
        name: projectIssueFieldDefinition.props.name,
        type: "com.atlassian.jira.plugin.system.customfieldtypes:select",
        description: `Synced from FlowMachine`,
      },
    });

    if (createCustomFieldResult.isErr()) {
      return err(createCustomFieldResult.error);
    }
    const customField = createCustomFieldResult.value;

    const createCustomFieldAssociationsResult =
      await jiraHttpCient.createCustomFieldAssociations({
        body: {
          associationContexts: [
            {
              identifier: project.props.integration.externalId,
              type: "PROJECT_ID",
            },
          ],
          fields: [
            {
              identifier: customField.id,
              type: "FIELD_ID",
            },
          ],
        },
      });

    if (createCustomFieldAssociationsResult.isErr()) {
      return err(createCustomFieldAssociationsResult.error);
    }
    const getCustomFieldContextsResult =
      await jiraHttpCient.getCustomFieldContexts({
        params: { fieldId: customField.id },
      });

    if (getCustomFieldContextsResult.isErr()) {
      return err(getCustomFieldContextsResult.error);
    }
    const customFieldContexts = getCustomFieldContextsResult.value;
    const firstCustomFieldContextId = customFieldContexts.values[0]?.id;

    if (isNil(firstCustomFieldContextId)) {
      return err(Err.code("notFound"));
    }
    const createCustomFieldContextOptionsResult =
      await jiraHttpCient.createCustomFieldContextOptions({
        params: {
          fieldId: customField.id,
          contextId: firstCustomFieldContextId,
        },
        body: {
          options:
            projectIssueFieldDefinition.props.options?.map((o) => ({
              value: o.value,
            })) ?? [],
        },
      });

    if (createCustomFieldContextOptionsResult.isErr()) {
      return err(createCustomFieldContextOptionsResult.error);
    }
    return ok({
      externalId: customField.id,
      externalKey: customField.key,
    });
  }

  async deleteCustomIssueField(
    input: Parameters<ExternalProjectService["deleteCustomIssueField"]>[0],
  ) {
    const { credential, project, projectIssueFieldDefinition } = input;

    if (isNil(project.props.integration)) {
      return err(Err.code("badRequest"));
    }
    if (credential.props.type !== "basic") {
      return err(Err.code("badRequest"));
    }

    const jiraHttpCient = JiraHttpClient.makeNew({
      apiKey: btoa(`${credential.props.username}:${credential.props.password}`),
      domain: project.props.integration.domain,
    });

    if (isNil(projectIssueFieldDefinition.props.integration)) {
      return err(Err.code("badRequest"));
    }
    const deleteFieldResult = await jiraHttpCient.deleteField({
      params: {
        fieldId: projectIssueFieldDefinition.props.integration.externalId,
      },
    });

    if (deleteFieldResult.isErr()) {
      return err(deleteFieldResult.error);
    }
    return ok();
  }
}

export { JiraExternalProjectService };
