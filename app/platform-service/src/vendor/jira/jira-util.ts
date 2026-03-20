import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import { Err } from "@/shared/err/err";
import { JiraClient } from "@/vendor/jira/jira-client";

type JiraCredential =
  | { type: "basic"; username: string; password: string }
  | { type: "apiKey"; apiKey: string };

type JiraProjectIntegration = {
  domain: string;
  externalId: string;
};

type JiraFieldDefinition = {
  name: string;
  options?: { value: string }[];
  integration?: { externalId: string; externalKey: string } | null;
};

const createCustomIssueField = async (input: {
  credential: JiraCredential;
  project: { integration: JiraProjectIntegration | null };
  fieldDefinition: JiraFieldDefinition;
}) => {
  const { credential, project, fieldDefinition } = input;

  if (isNil(project.integration)) {
    return err(Err.code("badRequest"));
  }
  if (credential.type !== "basic") {
    return err(Err.code("badRequest"));
  }

  const jiraClient = JiraClient.makeNew({
    apiKey: btoa(`${credential.username}:${credential.password}`),
    domain: project.integration.domain,
  });

  const createCustomFieldResult = await jiraClient.createCustomField({
    body: {
      name: fieldDefinition.name,
      type: "com.atlassian.jira.plugin.system.customfieldtypes:select",
      description: "Synced from FlowMachine",
    },
  });

  if (createCustomFieldResult.isErr()) {
    return err(createCustomFieldResult.error);
  }
  const customField = createCustomFieldResult.value;

  const createCustomFieldAssociationsResult =
    await jiraClient.createCustomFieldAssociations({
      body: {
        associationContexts: [
          {
            identifier: project.integration.externalId,
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
    await jiraClient.getCustomFieldContexts({
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
    await jiraClient.createCustomFieldContextOptions({
      params: {
        fieldId: customField.id,
        contextId: firstCustomFieldContextId,
      },
      body: {
        options:
          fieldDefinition.options?.map((o) => ({
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
};

const deleteCustomIssueField = async (input: {
  credential: JiraCredential;
  project: { integration: JiraProjectIntegration | null };
  fieldDefinition: JiraFieldDefinition;
}) => {
  const { credential, project, fieldDefinition } = input;

  if (isNil(project.integration)) {
    return err(Err.code("badRequest"));
  }
  if (credential.type !== "basic") {
    return err(Err.code("badRequest"));
  }

  const jiraClient = JiraClient.makeNew({
    apiKey: btoa(`${credential.username}:${credential.password}`),
    domain: project.integration.domain,
  });

  if (isNil(fieldDefinition.integration)) {
    return err(Err.code("badRequest"));
  }

  const deleteFieldResult = await jiraClient.deleteField({
    params: {
      fieldId: fieldDefinition.integration.externalId,
    },
  });

  if (deleteFieldResult.isErr()) {
    return err(deleteFieldResult.error);
  }

  return ok();
};

export { createCustomIssueField, deleteCustomIssueField };
export type { JiraCredential, JiraFieldDefinition, JiraProjectIntegration };
