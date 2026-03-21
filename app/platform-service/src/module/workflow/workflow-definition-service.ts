import { err, ok } from "neverthrow";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import { workflowDefinitionRepository } from "@/module/workflow/workflow-definition-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

const createWorkflowDefinition = async (input: {
  ctx: { tenant: Tenant };
  payload: {
    name: string;
    description?: string;
    projects: WorkflowDefinition["projects"];
    actions: WorkflowDefinition["actions"];
    edges: WorkflowDefinition["edges"];
    isActive: boolean;
  };
}) => {
  const { ctx, payload } = input;

  const model = newModel({
    name: payload.name,
    description: payload.description,
    projects: payload.projects,
    actions: payload.actions,
    edges: payload.edges,
    isActive: payload.isActive,
  });
  const result = await workflowDefinitionRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getWorkflowDefinition = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  const result = await workflowDefinitionRepository.findById({ ctx, id });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listWorkflowDefinitions = async (input: {
  ctx: { tenant: Tenant };
  filter?: { projectId: Id };
}) => {
  const { ctx, filter } = input;

  return workflowDefinitionRepository.findMany({
    ctx,
    filter: filter?.projectId
      ? { "projects.id": filter.projectId }
      : undefined,
  });
};

const updateWorkflowDefinition = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<Omit<WorkflowDefinition, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await workflowDefinitionRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return workflowDefinitionRepository.update({ ctx, id, data });
};

const deleteWorkflowDefinition = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  return workflowDefinitionRepository.deleteById({ ctx, id });
};

const makeWorkflowDefinitionService = () => ({
  create: createWorkflowDefinition,
  get: getWorkflowDefinition,
  list: listWorkflowDefinitions,
  update: updateWorkflowDefinition,
  delete: deleteWorkflowDefinition,
});

export { makeWorkflowDefinitionService };
