import type { DomainEvent } from "@/domain/shared/domain-event";

import type { ProjectId } from "@/domain/project/project-id";
import type { ProjectProvider } from "@/domain/project/project-value-objects";
import type { ProjectIssueFieldDefinitionId } from "@/domain/project-issue-field/project-issue-field-id";
import type {
  IssueFieldIntegration,
  IssueFieldOption,
  IssueFieldType,
} from "@/domain/project-issue-field/project-issue-field-value-objects";

type IssueFieldDefinitionCreated = DomainEvent<
  "IssueFieldDefinitionCreated",
  {
    readonly issueFieldDefinitionId: ProjectIssueFieldDefinitionId;
    readonly projectId: ProjectId;
    readonly name: string;
    readonly type: IssueFieldType;
    readonly options: readonly IssueFieldOption[];
  }
>;

type IssueFieldOptionsUpdated = DomainEvent<
  "IssueFieldOptionsUpdated",
  {
    readonly issueFieldDefinitionId: ProjectIssueFieldDefinitionId;
    readonly options: readonly IssueFieldOption[];
  }
>;

type IssueFieldSyncedToProvider = DomainEvent<
  "IssueFieldSyncedToProvider",
  {
    readonly issueFieldDefinitionId: ProjectIssueFieldDefinitionId;
    readonly provider: ProjectProvider;
    readonly integration: IssueFieldIntegration;
  }
>;

type IssueFieldUnlinkedFromProvider = DomainEvent<
  "IssueFieldUnlinkedFromProvider",
  {
    readonly issueFieldDefinitionId: ProjectIssueFieldDefinitionId;
    readonly provider: ProjectProvider;
  }
>;

type IssueFieldDefinitionEvent =
  | IssueFieldDefinitionCreated
  | IssueFieldOptionsUpdated
  | IssueFieldSyncedToProvider
  | IssueFieldUnlinkedFromProvider;

export type {
  IssueFieldDefinitionCreated,
  IssueFieldDefinitionEvent,
  IssueFieldOptionsUpdated,
  IssueFieldSyncedToProvider,
  IssueFieldUnlinkedFromProvider,
};
