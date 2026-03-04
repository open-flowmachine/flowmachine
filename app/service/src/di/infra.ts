import { BetterAuthClientFactory } from "@/infra/better-auth/client-factory";
import { BetterAuthService } from "@/infra/better-auth/service";
import { EnvConfigService } from "@/infra/env/env-config-service";
import { InngestClientFactory } from "@/infra/inngest/client-factory";
import { JiraExternalProjectService } from "@/infra/jira/service";
import { AiAgentMongoCrudRepository } from "@/infra/mongo/ai-agent/crud-repository";
import { MongoClientFactory } from "@/infra/mongo/client";
import { CredentialMongoCrudRepository } from "@/infra/mongo/credential/crud-repository";
import { DocumentMongoCrudRepository } from "@/infra/mongo/document/crud-repository";
import { GitRepositoryMongoCrudRepository } from "@/infra/mongo/git-repository/crud-repository";
import { ProjectMongoCrudRepository } from "@/infra/mongo/project/crud-repository";
import { WorkflowDefinitionMongoCrudRepository } from "@/infra/mongo/workflow/definition/crud-repository";
import { ResendClientFactory } from "@/infra/resend/client-factory";
import { ResendEmailService } from "@/infra/resend/service";

const envConfigService = new EnvConfigService();

const mongoClientFactory = new MongoClientFactory(envConfigService);
const mongoClient = mongoClientFactory.make();

const jiraExternalProjectService = new JiraExternalProjectService();

const resendClientFactory = new ResendClientFactory(envConfigService);
const resendClient = resendClientFactory.make();
const resendEmailService = new ResendEmailService(resendClient);

const betterAuthClientFactory = new BetterAuthClientFactory(
  envConfigService,
  resendEmailService,
  mongoClient,
);
const betterAuthClient = betterAuthClientFactory.make();
const betterAuthService = new BetterAuthService(betterAuthClient);

const inngestClientFactory = new InngestClientFactory();
const inngestClient = inngestClientFactory.make();

// Repositories
const projectMongoCrudRepository = new ProjectMongoCrudRepository(
  envConfigService,
  mongoClient,
);
const credentialMongoCrudRepository = new CredentialMongoCrudRepository(
  envConfigService,
  mongoClient,
);
const aiAgentMongoCrudRepository = new AiAgentMongoCrudRepository(
  envConfigService,
  mongoClient,
);
const gitRepositoryMongoCrudRepository = new GitRepositoryMongoCrudRepository(
  envConfigService,
  mongoClient,
);
const documentMongoCrudRepository = new DocumentMongoCrudRepository(
  envConfigService,
  mongoClient,
);
const workflowDefinitionMongoCrudRepository =
  new WorkflowDefinitionMongoCrudRepository(envConfigService, mongoClient);

export {
  betterAuthClient,
  betterAuthService,
  envConfigService,
  inngestClient,
  jiraExternalProjectService,
  mongoClient,
  projectMongoCrudRepository,
  credentialMongoCrudRepository,
  aiAgentMongoCrudRepository,
  gitRepositoryMongoCrudRepository,
  documentMongoCrudRepository,
  workflowDefinitionMongoCrudRepository,
};
