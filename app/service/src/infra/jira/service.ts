import { err, ok } from "neverthrow";
import { Err } from "@/common/err/err";
import type { CredentialEntity } from "@/core/domain/credential/entity";
import type { ProjectEntity } from "@/core/domain/project/entity";
import type { ExternalProjectService } from "@/core/infra/external/project/service";
import { JiraApiClient } from "@/infra/jira/client";

class JiraExternalProjectService implements ExternalProjectService {
  async syncAiAgentIssueField(
    input: Parameters<ExternalProjectService["syncAiAgentIssueField"]>[0],
  ) {
    const { credential, project, aiAgent } = input;

    try {
      const client = this.#buildClient(credential, project);
      const optionValue = `${aiAgent.props.name} (${aiAgent.props.model})`;

      await this.#syncCustomFieldOption(client, {
        fieldName: "AI Agent",
        projectId: project.props.integration!.externalId,
        optionValue,
      });

      return ok();
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async syncGitRepositoryIssueField(
    input: Parameters<ExternalProjectService["syncGitRepositoryIssueField"]>[0],
  ) {
    const { credential, project, gitRepository } = input;

    try {
      const client = this.#buildClient(credential, project);
      const optionValue = `${gitRepository.props.name} (${gitRepository.props.url})`;

      await this.#syncCustomFieldOption(client, {
        fieldName: "Git Repository",
        projectId: project.props.integration!.externalId,
        optionValue,
      });

      return ok();
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async syncWorkflowDefinitionIssueField(
    input: Parameters<
      ExternalProjectService["syncWorkflowDefinitionIssueField"]
    >[0],
  ) {
    const { credential, project, workflowDefinition } = input;

    try {
      const client = this.#buildClient(credential, project);
      const optionValue = workflowDefinition.props.name;

      await this.#syncCustomFieldOption(client, {
        fieldName: "Workflow Definition",
        projectId: project.props.integration!.externalId,
        optionValue,
      });

      return ok();
    } catch (error) {
      return err(Err.from(error));
    }
  }

  #buildClient(credential: CredentialEntity, project: ProjectEntity) {
    const baseUrl = project.props.integration!.baseUrl;
    return JiraApiClient.fromCredential(baseUrl, credential);
  }

  async #syncCustomFieldOption(
    client: JiraApiClient,
    input: { fieldName: string; projectId: string; optionValue: string },
  ) {
    const { fieldName, projectId, optionValue } = input;

    const fieldId = await this.#findOrCreateField(client, fieldName);
    const contextId = await this.#findOrCreateContext(
      client,
      fieldId,
      projectId,
    );
    await this.#createOrUpdateOption(client, fieldId, contextId, optionValue);
  }

  async #findOrCreateField(client: JiraApiClient, fieldName: string) {
    const fields = await client.listFields();
    const existing = fields.find((f) => f.custom && f.name === fieldName);

    if (existing) {
      return existing.id;
    }

    const created = await client.createField({
      name: fieldName,
      type: "com.atlassian.jira.plugin.system.customfieldtypes:select",
      searcherKey:
        "com.atlassian.jira.plugin.system.customfieldtypes:multiselectsearcher",
    });

    return created.id;
  }

  async #findOrCreateContext(
    client: JiraApiClient,
    fieldId: string,
    projectId: string,
  ) {
    const contexts = await client.getFieldContexts(fieldId);
    const existing = contexts.find(
      (c) => !c.isGlobalContext && c.projectIds?.includes(projectId),
    );

    if (existing) {
      return existing.id;
    }

    const created = await client.createFieldContext(fieldId, {
      name: `Context for project ${projectId}`,
      projectIds: [projectId],
    });

    return created.id;
  }

  async #createOrUpdateOption(
    client: JiraApiClient,
    fieldId: string,
    contextId: string,
    optionValue: string,
  ) {
    const options = await client.getContextOptions(fieldId, contextId);
    const existing = options.find((o) => o.value === optionValue);

    if (existing) {
      return;
    }

    await client.createContextOptions(fieldId, contextId, [
      { value: optionValue },
    ]);
  }
}

export { JiraExternalProjectService };
