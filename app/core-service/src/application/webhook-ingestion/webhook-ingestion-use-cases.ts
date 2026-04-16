import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { WorkflowExecutionId } from "@/domain/workflow-execution/workflow-execution-id";

import type { ApplicationError } from "@/application/shared/errors";

type HandleJiraIssueUpdatedWebhookCommand = {
  tenant: Tenant;
  rawBody: string;
  signatureHeader: string;
  payload: Readonly<Record<string, unknown>>;
};
type HandleJiraIssueUpdatedWebhookOutput = {
  triggeredExecutionIds: readonly WorkflowExecutionId[];
};
type HandleJiraIssueUpdatedWebhookUseCase = {
  execute(
    command: HandleJiraIssueUpdatedWebhookCommand,
  ): Promise<Result<HandleJiraIssueUpdatedWebhookOutput, ApplicationError>>;
};

export type {
  HandleJiraIssueUpdatedWebhookCommand,
  HandleJiraIssueUpdatedWebhookOutput,
  HandleJiraIssueUpdatedWebhookUseCase,
};
