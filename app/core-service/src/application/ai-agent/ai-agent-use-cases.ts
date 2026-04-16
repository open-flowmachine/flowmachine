import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { AiAgent } from "@/domain/ai-agent/ai-agent";
import type { AiAgentId } from "@/domain/ai-agent/ai-agent-id";
import type { AiModel } from "@/domain/ai-agent/ai-agent-value-objects";
import type { ProjectId } from "@/domain/project/project-id";

import type { ApplicationError } from "@/application/shared/errors";

type CreateAiAgentCommand = {
  tenant: Tenant;
  name: string;
  model: AiModel;
  projectIds?: readonly ProjectId[];
};
type CreateAiAgentOutput = { id: AiAgentId };
type CreateAiAgentUseCase = {
  execute(
    command: CreateAiAgentCommand,
  ): Promise<Result<CreateAiAgentOutput, ApplicationError>>;
};

type GetAiAgentCommand = { tenant: Tenant; id: AiAgentId };
type GetAiAgentOutput = { aiAgent: AiAgent };
type GetAiAgentUseCase = {
  execute(
    command: GetAiAgentCommand,
  ): Promise<Result<GetAiAgentOutput, ApplicationError>>;
};

type ListAiAgentsCommand = {
  tenant: Tenant;
  filter?: { projectId?: ProjectId };
};
type ListAiAgentsOutput = { aiAgents: readonly AiAgent[] };
type ListAiAgentsUseCase = {
  execute(
    command: ListAiAgentsCommand,
  ): Promise<Result<ListAiAgentsOutput, ApplicationError>>;
};

type RenameAiAgentCommand = { tenant: Tenant; id: AiAgentId; name: string };
type RenameAiAgentUseCase = {
  execute(
    command: RenameAiAgentCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type ChangeAiAgentModelCommand = {
  tenant: Tenant;
  id: AiAgentId;
  model: AiModel;
};
type ChangeAiAgentModelUseCase = {
  execute(
    command: ChangeAiAgentModelCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type LinkAiAgentToProjectCommand = {
  tenant: Tenant;
  id: AiAgentId;
  projectId: ProjectId;
};
type LinkAiAgentToProjectUseCase = {
  execute(
    command: LinkAiAgentToProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type UnlinkAiAgentFromProjectCommand = {
  tenant: Tenant;
  id: AiAgentId;
  projectId: ProjectId;
};
type UnlinkAiAgentFromProjectUseCase = {
  execute(
    command: UnlinkAiAgentFromProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeleteAiAgentCommand = { tenant: Tenant; id: AiAgentId };
type DeleteAiAgentUseCase = {
  execute(
    command: DeleteAiAgentCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  ChangeAiAgentModelCommand,
  ChangeAiAgentModelUseCase,
  CreateAiAgentCommand,
  CreateAiAgentOutput,
  CreateAiAgentUseCase,
  DeleteAiAgentCommand,
  DeleteAiAgentUseCase,
  GetAiAgentCommand,
  GetAiAgentOutput,
  GetAiAgentUseCase,
  LinkAiAgentToProjectCommand,
  LinkAiAgentToProjectUseCase,
  ListAiAgentsCommand,
  ListAiAgentsOutput,
  ListAiAgentsUseCase,
  RenameAiAgentCommand,
  RenameAiAgentUseCase,
  UnlinkAiAgentFromProjectCommand,
  UnlinkAiAgentFromProjectUseCase,
};
