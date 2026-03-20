import { err, ok } from "neverthrow";
import type { GitRepository } from "@/module/git-repository/git-repository-model";
import { gitRepositoryRepository } from "@/module/git-repository/git-repository-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

const createGitRepository = async (input: {
  ctx: { tenant: Tenant };
  payload: {
    name: string;
    url: string;
    config: GitRepository["config"];
    integration: GitRepository["integration"];
    projects: GitRepository["projects"];
  };
}) => {
  const { ctx, payload } = input;

  const model = newModel({
    name: payload.name,
    url: payload.url,
    config: payload.config,
    integration: payload.integration,
    projects: payload.projects,
  });
  const result = await gitRepositoryRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getGitRepository = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  const result = await gitRepositoryRepository.findById({ ctx, id });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listGitRepositories = async (input: {
  ctx: { tenant: Tenant };
  filter?: { projectId: Id };
}) => {
  const { ctx, filter } = input;

  return gitRepositoryRepository.findMany({
    ctx,
    filter: filter?.projectId
      ? { "projects.id": filter.projectId }
      : undefined,
  });
};

const updateGitRepository = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<Omit<GitRepository, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await gitRepositoryRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return gitRepositoryRepository.update({ ctx, id, data });
};

const deleteGitRepository = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  return gitRepositoryRepository.deleteById({ ctx, id });
};

const makeGitRepositoryService = () => ({
  create: createGitRepository,
  get: getGitRepository,
  list: listGitRepositories,
  update: updateGitRepository,
  delete: deleteGitRepository,
});

export { makeGitRepositoryService };
