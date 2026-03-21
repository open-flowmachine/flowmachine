import type { Id, Model } from "@/lib/schema";

type WorkflowAction = {
  id: string;
  kind: string;
  name: string;
  inputs?: Record<string, unknown>;
};

type WorkflowEdge = {
  from: string;
  to: string;
};

type WorkflowDefinition = Model<{
  name: string;
  description?: string;
  projects: { id: Id }[];
  actions: WorkflowAction[];
  edges: WorkflowEdge[];
  isActive: boolean;
}>;

type HttpClientCreateWorkflowDefinitionInput = {
  body: {
    name: WorkflowDefinition["name"];
    description?: WorkflowDefinition["description"];
    projects: WorkflowDefinition["projects"];
    actions: WorkflowDefinition["actions"];
    edges: WorkflowDefinition["edges"];
    isActive: WorkflowDefinition["isActive"];
  };
};

type HttpClientDeleteWorkflowDefinitionInput = {
  params: {
    id: Id;
  };
};

type HttpClientGetWorkflowDefinitionInput = {
  params: {
    id: Id;
  };
};

type HttpClientUpdateWorkflowDefinitionInput = {
  params: {
    id: Id;
  };
  body: {
    name?: WorkflowDefinition["name"];
    description?: WorkflowDefinition["description"];
    projects?: WorkflowDefinition["projects"];
    actions?: WorkflowDefinition["actions"];
    edges?: WorkflowDefinition["edges"];
    isActive?: WorkflowDefinition["isActive"];
  };
};

export type {
  WorkflowAction,
  WorkflowEdge,
  WorkflowDefinition,
  HttpClientCreateWorkflowDefinitionInput,
  HttpClientDeleteWorkflowDefinitionInput,
  HttpClientGetWorkflowDefinitionInput,
  HttpClientUpdateWorkflowDefinitionInput,
};
