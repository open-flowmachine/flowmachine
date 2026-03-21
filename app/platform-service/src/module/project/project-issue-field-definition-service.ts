import { err, ok } from "neverthrow";
import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import { projectIssueFieldDefinitionRepository } from "@/module/project/project-issue-field-definition-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

const createProjectIssueFieldDefinition = async (input: {
  ctx: { tenant: Tenant };
  payload: {
    name: string;
    type: ProjectIssueFieldDefinition["type"];
    options: ProjectIssueFieldDefinition["options"];
    integration: ProjectIssueFieldDefinition["integration"];
    project: { id: Id };
  };
}) => {
  const { ctx, payload } = input;

  const model = newModel({
    name: payload.name,
    type: payload.type,
    options: payload.options,
    integration: payload.integration,
    project: payload.project,
  });
  const result = await projectIssueFieldDefinitionRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getProjectIssueFieldDefinition = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  const result = await projectIssueFieldDefinitionRepository.findById({
    ctx,
    id,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listProjectIssueFieldDefinitions = async (input: {
  ctx: { tenant: Tenant };
  filter?: { projectId?: Id; name?: string };
}) => {
  const { ctx, filter } = input;

  const mongoFilter: Record<string, unknown> = {};
  if (filter?.projectId) {
    mongoFilter["project.id"] = filter.projectId;
  }
  if (filter?.name) {
    mongoFilter.name = filter.name;
  }

  return projectIssueFieldDefinitionRepository.findMany({
    ctx,
    filter: Object.keys(mongoFilter).length > 0 ? mongoFilter : undefined,
  });
};

const updateProjectIssueFieldDefinition = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<
    Omit<ProjectIssueFieldDefinition, ExcludedUpdateModelFields>
  >;
}) => {
  const { ctx, id, data } = input;

  const findResult = await projectIssueFieldDefinitionRepository.findById({
    ctx,
    id,
  });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return projectIssueFieldDefinitionRepository.update({ ctx, id, data });
};

const deleteProjectIssueFieldDefinition = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  return projectIssueFieldDefinitionRepository.deleteById({ ctx, id });
};

const makeProjectIssueFieldDefinitionService = () => ({
  create: createProjectIssueFieldDefinition,
  get: getProjectIssueFieldDefinition,
  list: listProjectIssueFieldDefinitions,
  update: updateProjectIssueFieldDefinition,
  delete: deleteProjectIssueFieldDefinition,
});

export { makeProjectIssueFieldDefinitionService };
