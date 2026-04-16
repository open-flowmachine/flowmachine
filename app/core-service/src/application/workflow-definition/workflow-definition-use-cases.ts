import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";
import type { WorkflowDefinition } from "@/domain/workflow-definition/workflow-definition";
import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";
import type {
  WorkflowAction,
  WorkflowEdge,
} from "@/domain/workflow-definition/workflow-definition-value-objects";

import type { ApplicationError } from "@/application/shared/errors";

type CreateWorkflowDefinitionCommand = {
  tenant: Tenant;
  name: string;
  description?: string;
  projectIds?: readonly ProjectId[];
  actions?: readonly WorkflowAction[];
  edges?: readonly WorkflowEdge[];
  isActive?: boolean;
};
type CreateWorkflowDefinitionOutput = { id: WorkflowDefinitionId };
type CreateWorkflowDefinitionUseCase = {
  execute(
    command: CreateWorkflowDefinitionCommand,
  ): Promise<Result<CreateWorkflowDefinitionOutput, ApplicationError>>;
};

type GetWorkflowDefinitionCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
};
type GetWorkflowDefinitionOutput = {
  workflowDefinition: WorkflowDefinition;
};
type GetWorkflowDefinitionUseCase = {
  execute(
    command: GetWorkflowDefinitionCommand,
  ): Promise<Result<GetWorkflowDefinitionOutput, ApplicationError>>;
};

type ListWorkflowDefinitionsCommand = {
  tenant: Tenant;
  filter?: { projectId?: ProjectId };
};
type ListWorkflowDefinitionsOutput = {
  workflowDefinitions: readonly WorkflowDefinition[];
};
type ListWorkflowDefinitionsUseCase = {
  execute(
    command: ListWorkflowDefinitionsCommand,
  ): Promise<Result<ListWorkflowDefinitionsOutput, ApplicationError>>;
};

type AddWorkflowActionCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
  action: WorkflowAction;
};
type AddWorkflowActionUseCase = {
  execute(
    command: AddWorkflowActionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type RemoveWorkflowActionCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
  actionId: string;
};
type RemoveWorkflowActionUseCase = {
  execute(
    command: RemoveWorkflowActionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type AddWorkflowEdgeCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
  edge: WorkflowEdge;
};
type AddWorkflowEdgeUseCase = {
  execute(
    command: AddWorkflowEdgeCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type RemoveWorkflowEdgeCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
  edge: WorkflowEdge;
};
type RemoveWorkflowEdgeUseCase = {
  execute(
    command: RemoveWorkflowEdgeCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type ActivateWorkflowDefinitionCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
};
type ActivateWorkflowDefinitionUseCase = {
  execute(
    command: ActivateWorkflowDefinitionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeactivateWorkflowDefinitionCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
};
type DeactivateWorkflowDefinitionUseCase = {
  execute(
    command: DeactivateWorkflowDefinitionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeleteWorkflowDefinitionCommand = {
  tenant: Tenant;
  id: WorkflowDefinitionId;
};
type DeleteWorkflowDefinitionUseCase = {
  execute(
    command: DeleteWorkflowDefinitionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  ActivateWorkflowDefinitionCommand,
  ActivateWorkflowDefinitionUseCase,
  AddWorkflowActionCommand,
  AddWorkflowActionUseCase,
  AddWorkflowEdgeCommand,
  AddWorkflowEdgeUseCase,
  CreateWorkflowDefinitionCommand,
  CreateWorkflowDefinitionOutput,
  CreateWorkflowDefinitionUseCase,
  DeactivateWorkflowDefinitionCommand,
  DeactivateWorkflowDefinitionUseCase,
  DeleteWorkflowDefinitionCommand,
  DeleteWorkflowDefinitionUseCase,
  GetWorkflowDefinitionCommand,
  GetWorkflowDefinitionOutput,
  GetWorkflowDefinitionUseCase,
  ListWorkflowDefinitionsCommand,
  ListWorkflowDefinitionsOutput,
  ListWorkflowDefinitionsUseCase,
  RemoveWorkflowActionCommand,
  RemoveWorkflowActionUseCase,
  RemoveWorkflowEdgeCommand,
  RemoveWorkflowEdgeUseCase,
};
