import { HttpAuthGuardFactory } from "@/api/plugin/http-auth-guard-factory";
import { HttpErrorHandlerFactory } from "@/api/plugin/http-error-handler-factory";
import { HttpRequestCtxFactory } from "@/api/plugin/http-request-ctx-factory";
import { BetterAuthClientFactory } from "@/infra/better-auth/client-factory";
import { BetterAuthService } from "@/infra/better-auth/service";
import { EnvConfigService } from "@/infra/env/env-config-service";
import { JiraExternalProjectService } from "@/infra/jira/service";
import { MongoClientFactory } from "@/infra/mongo/client";
import { logger } from "@/infra/pino/logger";
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

const httpRequestCtxFactory = new HttpRequestCtxFactory(mongoClient);
const httpAuthGuardFactory = new HttpAuthGuardFactory(betterAuthService);
const httpErrorHandlerFactory = new HttpErrorHandlerFactory(logger);

export {
  betterAuthClient,
  betterAuthService,
  envConfigService,
  httpRequestCtxFactory,
  httpAuthGuardFactory,
  httpErrorHandlerFactory,
  jiraExternalProjectService,
  mongoClient,
};
