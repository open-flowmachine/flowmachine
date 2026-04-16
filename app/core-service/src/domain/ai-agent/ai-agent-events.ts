import type { DomainEvent } from "@/domain/shared/domain-event";

import type { AiAgentId } from "@/domain/ai-agent/ai-agent-id";
import type { AiModel } from "@/domain/ai-agent/ai-agent-value-objects";
import type { ProjectId } from "@/domain/project/project-id";

type AiAgentCreated = DomainEvent<
  "AiAgentCreated",
  {
    readonly aiAgentId: AiAgentId;
    readonly name: string;
    readonly model: AiModel;
  }
>;

type AiAgentRenamed = DomainEvent<
  "AiAgentRenamed",
  {
    readonly aiAgentId: AiAgentId;
    readonly name: string;
  }
>;

type AiAgentModelChanged = DomainEvent<
  "AiAgentModelChanged",
  {
    readonly aiAgentId: AiAgentId;
    readonly model: AiModel;
  }
>;

type AiAgentLinkedToProject = DomainEvent<
  "AiAgentLinkedToProject",
  {
    readonly aiAgentId: AiAgentId;
    readonly projectId: ProjectId;
  }
>;

type AiAgentUnlinkedFromProject = DomainEvent<
  "AiAgentUnlinkedFromProject",
  {
    readonly aiAgentId: AiAgentId;
    readonly projectId: ProjectId;
  }
>;

type AiAgentEvent =
  | AiAgentCreated
  | AiAgentRenamed
  | AiAgentModelChanged
  | AiAgentLinkedToProject
  | AiAgentUnlinkedFromProject;

export type {
  AiAgentCreated,
  AiAgentEvent,
  AiAgentLinkedToProject,
  AiAgentModelChanged,
  AiAgentRenamed,
  AiAgentUnlinkedFromProject,
};
