import type { Result } from "@/domain/shared/result";

import type { Credential } from "@/domain/credential/credential";
import type { Project } from "@/domain/project/project";
import type { ProjectIssueFieldDefinition } from "@/domain/project-issue-field/project-issue-field";

import type { ApplicationError } from "@/application/shared/errors";

type ExternalIssueFieldRef = {
  readonly externalId: string;
  readonly externalKey: string;
};

type ExternalIssueTrackerPort = {
  createCustomIssueField(input: {
    credential: Credential;
    project: Project;
    fieldDefinition: ProjectIssueFieldDefinition;
  }): Promise<Result<ExternalIssueFieldRef, ApplicationError>>;
  deleteCustomIssueField(input: {
    credential: Credential;
    project: Project;
    fieldDefinition: ProjectIssueFieldDefinition;
  }): Promise<Result<void, ApplicationError>>;
};

export type { ExternalIssueFieldRef, ExternalIssueTrackerPort };
