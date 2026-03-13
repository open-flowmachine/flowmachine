import { AiAgentV1HttpRouterFactory } from "@/api/module/ai-agent/v1/http-router-factory";
import { BetterAuthHttpRouterFactory } from "@/api/module/auth/http-router-factory";
import { CredentialV1HttpRouterFactory } from "@/api/module/credential/v1/http-router-factory";
import { DocumentV1HttpRouterFactory } from "@/api/module/document/v1/http-router-factory";
import { GitRepositoryV1HttpRouterFactory } from "@/api/module/git-repository/v1/http-router-factory";
import { HealthHttpRouterFactory } from "@/api/module/health/http-router-factory";
import { InngestHttpRouterFactory } from "@/api/module/inngest/http-router-factory";
import { ProjectV1HttpRouterFactory } from "@/api/module/project/v1/http-router-factory";
import { ProjectSyncV1HttpRouterFactory } from "@/api/module/project/v1/sync/http-router-factory";
import { WorkflowActionDefinitionV1HttpRouterFactory } from "@/api/module/workflow/action/v1/http-router-factory";
import { WorkflowDefinitionV1HttpRouterFactory } from "@/api/module/workflow/definition/v1/http-router-factory";
import { HttpAuthGuardFactory } from "@/api/plugin/http-auth-guard-factory";
import { HttpErrorHandlerFactory } from "@/api/plugin/http-error-handler-factory";
import { HttpRequestCtxFactory } from "@/api/plugin/http-request-ctx-factory";
import {
  aiAgentBasicCrudService,
  credentialBasicCrudService,
  documentBasicCrudService,
  gitRepositoryBasicCrudService,
  projectBasicCrudService,
  projectSyncBasicService,
  workflowActionDefinitionBasicCrudService,
  workflowDefinitionBasicCrudService,
} from "@/di/app";
import {
  betterAuthClient,
  betterAuthService,
  envConfigService,
  inngestClient,
  mongoClient,
} from "@/di/infra";
import { workflowSdlcFunctionFactory } from "@/di/orchestration";
import { logger } from "@/infra/pino/logger";

const httpRequestCtxFactory = new HttpRequestCtxFactory(mongoClient);
const httpAuthGuardFactory = new HttpAuthGuardFactory(betterAuthService);
const httpErrorHandlerFactory = new HttpErrorHandlerFactory(logger);

const healthHttpRouterFactory = new HealthHttpRouterFactory(envConfigService);

const betterAuthHttpRouterFactory = new BetterAuthHttpRouterFactory(
  betterAuthClient,
);

const aiAgentV1HttpRouterFactory = new AiAgentV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  aiAgentBasicCrudService,
);

const credentialV1HttpRouterFactory = new CredentialV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  credentialBasicCrudService,
);

const documentV1HttpRouterFactory = new DocumentV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  documentBasicCrudService,
);

const gitRepositoryV1HttpRouterFactory = new GitRepositoryV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  gitRepositoryBasicCrudService,
);

const projectV1HttpRouterFactory = new ProjectV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  projectBasicCrudService,
);
const projectSyncV1HttpRouterFactory = new ProjectSyncV1HttpRouterFactory(
  httpAuthGuardFactory,
  httpRequestCtxFactory,
  projectSyncBasicService,
);

const workflowDefinitionV1HttpRouterFactory =
  new WorkflowDefinitionV1HttpRouterFactory(
    httpAuthGuardFactory,
    httpRequestCtxFactory,
    workflowDefinitionBasicCrudService,
  );

const workflowActionDefinitionV1HttpRouterFactory =
  new WorkflowActionDefinitionV1HttpRouterFactory(
    httpAuthGuardFactory,
    httpRequestCtxFactory,
    workflowActionDefinitionBasicCrudService,
  );

const inngestHttpRouterFactory = new InngestHttpRouterFactory(inngestClient, [
  workflowSdlcFunctionFactory.make(),
]);

export {
  httpAuthGuardFactory,
  httpErrorHandlerFactory,
  httpRequestCtxFactory,
  aiAgentV1HttpRouterFactory,
  betterAuthHttpRouterFactory,
  credentialV1HttpRouterFactory,
  documentV1HttpRouterFactory,
  gitRepositoryV1HttpRouterFactory,
  healthHttpRouterFactory,
  inngestHttpRouterFactory,
  projectV1HttpRouterFactory,
  projectSyncV1HttpRouterFactory,
  workflowActionDefinitionV1HttpRouterFactory,
  workflowDefinitionV1HttpRouterFactory,
};
