import type { DomainEvent } from "@/domain/shared/domain-event";

import type { ProjectId } from "@/domain/project/project-id";
import type {
  ProjectIntegration,
  ProjectProvider,
} from "@/domain/project/project-value-objects";

type ProjectCreated = DomainEvent<
  "ProjectCreated",
  {
    readonly projectId: ProjectId;
    readonly name: string;
  }
>;

type ProjectRenamed = DomainEvent<
  "ProjectRenamed",
  {
    readonly projectId: ProjectId;
    readonly name: string;
  }
>;

type ProjectIntegrationConfigured = DomainEvent<
  "ProjectIntegrationConfigured",
  {
    readonly projectId: ProjectId;
    readonly provider: ProjectProvider;
    readonly integration: ProjectIntegration;
  }
>;

type ProjectIntegrationRemoved = DomainEvent<
  "ProjectIntegrationRemoved",
  {
    readonly projectId: ProjectId;
    readonly provider: ProjectProvider;
  }
>;

type ProjectEvent =
  | ProjectCreated
  | ProjectRenamed
  | ProjectIntegrationConfigured
  | ProjectIntegrationRemoved;

export type {
  ProjectCreated,
  ProjectEvent,
  ProjectIntegrationConfigured,
  ProjectIntegrationRemoved,
  ProjectRenamed,
};
