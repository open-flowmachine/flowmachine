import { AiAgentBasicCrudService } from "@/app/domain/ai-agent/basic-crud-service";
import { CredentialBasicCrudService } from "@/app/domain/credential/basic-crud-service";
import { DocumentBasicCrudService } from "@/app/domain/document/basic-crud-service";
import { GitRepositoryBasicCrudService } from "@/app/domain/git-repository/basic-crud-service";
import { ProjectBasicCrudService } from "@/app/domain/project/basic-crud-service";
import { ProjectIssueFieldDefinitionBasicCrudService } from "@/app/domain/project/issue/field/definition/basic-crud-service";
import { WorkflowDefinitionBasicCrudService } from "@/app/domain/workflow/definition/basic-crud-service";
import { ProjectSyncBasicService } from "@/app/feature/project/sync/basic-service";
import {
  aiAgentMongoCrudRepository,
  credentialMongoCrudRepository,
  documentMongoCrudRepository,
  gitRepositoryMongoCrudRepository,
  jiraExternalProjectService,
  projectMongoCrudRepository,
  projectIssueFieldDefinitionMongoCrudRepository,
  workflowDefinitionMongoCrudRepository,
} from "@/di/infra";
import { WorkflowSdlcActionDefinitionCrudService } from "@/orchestrator/workflow/sdlc/action-definition-service";

// Domain services
const projectBasicCrudService = new ProjectBasicCrudService(
  projectMongoCrudRepository,
);
const credentialBasicCrudService = new CredentialBasicCrudService(
  credentialMongoCrudRepository,
);
const aiAgentBasicCrudService = new AiAgentBasicCrudService(
  aiAgentMongoCrudRepository,
);
const gitRepositoryBasicCrudService = new GitRepositoryBasicCrudService(
  gitRepositoryMongoCrudRepository,
);
const documentBasicCrudService = new DocumentBasicCrudService(
  documentMongoCrudRepository,
);
const workflowDefinitionBasicCrudService =
  new WorkflowDefinitionBasicCrudService(workflowDefinitionMongoCrudRepository);
const workflowActionDefinitionBasicCrudService =
  new WorkflowSdlcActionDefinitionCrudService();
const projectIssueFieldDefinitionBasicCrudService =
  new ProjectIssueFieldDefinitionBasicCrudService(
    projectIssueFieldDefinitionMongoCrudRepository,
  );

// Feature services
const projectSyncBasicService = new ProjectSyncBasicService(
  projectBasicCrudService,
  credentialBasicCrudService,
  aiAgentBasicCrudService,
  gitRepositoryBasicCrudService,
  workflowDefinitionBasicCrudService,
  projectIssueFieldDefinitionBasicCrudService,
  jiraExternalProjectService,
);

export {
  aiAgentBasicCrudService,
  aiAgentMongoCrudRepository,
  credentialBasicCrudService,
  credentialMongoCrudRepository,
  documentBasicCrudService,
  documentMongoCrudRepository,
  gitRepositoryBasicCrudService,
  gitRepositoryMongoCrudRepository,
  projectBasicCrudService,
  projectMongoCrudRepository,
  projectSyncBasicService,
  workflowActionDefinitionBasicCrudService,
  workflowDefinitionBasicCrudService,
  workflowDefinitionMongoCrudRepository,
};
