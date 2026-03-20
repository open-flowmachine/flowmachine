import { err, ok } from "neverthrow";
import type { Project } from "@/module/project/project-model";
import { projectRepository } from "@/module/project/project-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

const createProject = async (input: {
  ctx: { tenant: Tenant };
  payload: { name: string; integration: Project["integration"] };
}) => {
  const { ctx, payload } = input;

  const model = newModel({
    name: payload.name,
    integration: payload.integration,
  });
  const result = await projectRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getProject = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
  const { ctx, id } = input;

  const result = await projectRepository.findById({ ctx, id });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listProjects = async (input: { ctx: { tenant: Tenant } }) => {
  const { ctx } = input;

  return projectRepository.findMany({ ctx });
};

const updateProject = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<Omit<Project, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await projectRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return projectRepository.update({ ctx, id, data });
};

const deleteProject = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
  const { ctx, id } = input;

  return projectRepository.deleteById({ ctx, id });
};

const makeProjectService = () => ({
  create: createProject,
  get: getProject,
  list: listProjects,
  update: updateProject,
  delete: deleteProject,
});

export { makeProjectService };
