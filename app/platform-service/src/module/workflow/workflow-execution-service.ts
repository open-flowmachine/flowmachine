import { err, ok } from "neverthrow";
import type { WorkflowExecution } from "@/module/workflow/workflow-execution-model";
import { workflowExecutionRepository } from "@/module/workflow/workflow-execution-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

const createWorkflowExecution = async (input: {
  ctx: { tenant: Tenant };
  payload: {
    integration: WorkflowExecution["integration"];
    workflowDefinition: WorkflowExecution["workflowDefinition"];
  };
}) => {
  const { ctx, payload } = input;

  const model = newModel({
    integration: payload.integration,
    workflowDefinition: payload.workflowDefinition,
  });
  const result = await workflowExecutionRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getWorkflowExecution = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  const result = await workflowExecutionRepository.findById({ ctx, id });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listWorkflowExecutions = async (input: {
  ctx: { tenant: Tenant };
  filter?: { workflowDefinitionId: Id };
}) => {
  const { ctx, filter } = input;

  return workflowExecutionRepository.findMany({
    ctx,
    filter: filter?.workflowDefinitionId
      ? { "workflowDefinition.id": filter.workflowDefinitionId }
      : undefined,
  });
};

const updateWorkflowExecution = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<Omit<WorkflowExecution, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await workflowExecutionRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return workflowExecutionRepository.update({ ctx, id, data });
};

const deleteWorkflowExecution = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  return workflowExecutionRepository.deleteById({ ctx, id });
};

const makeWorkflowExecutionService = () => ({
  create: createWorkflowExecution,
  get: getWorkflowExecution,
  list: listWorkflowExecutions,
  update: updateWorkflowExecution,
  delete: deleteWorkflowExecution,
});

export { makeWorkflowExecutionService };
