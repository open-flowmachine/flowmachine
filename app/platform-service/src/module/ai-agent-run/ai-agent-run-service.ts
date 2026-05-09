import type { Filter } from "mongodb";

import { err, ok } from "neverthrow";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant, TenantAware } from "@/shared/tenant/tenant-model";

import { aiAgentRunRepository } from "@/module/ai-agent-run/ai-agent-run-repository";
import { Err } from "@/shared/err/err";
import {
  type ExcludedUpdateModelFields,
  type PartialWithUndefined,
  newModel,
} from "@/shared/model/model";

const adminListAiAgentRuns = async (input: {
  ctx: TenantAware;
  filter?: Filter<AiAgentRun> | undefined;
}) => {
  const { ctx, filter } = input;
  return aiAgentRunRepository.findMany({
    ctx,
    filter,
  });
};

const adminUpdateAiAgentRun = async (input: {
  ctx: TenantAware;
  id: Id;
  data: PartialWithUndefined<Omit<AiAgentRun, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await aiAgentRunRepository.findById({ ctx, id });
  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }
  return aiAgentRunRepository.update({ ctx, id, data });
};

const createAiAgentRun = async (input: {
  ctx: { tenant: Tenant };
  payload: Omit<AiAgentRun, "id" | "_version" | "createdAt" | "updatedAt">;
}) => {
  const { ctx, payload } = input;

  const model = newModel(payload);
  const insertResult = await aiAgentRunRepository.insert({ ctx, data: model });

  if (insertResult.isErr()) {
    return err(insertResult.error);
  }
  return ok({ id: model.id });
};

const getAiAgentRun = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
  const { ctx, id } = input;

  const result = await aiAgentRunRepository.findById({ ctx, id });
  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }
  return ok({ data: result.value.data });
};

const listAiAgentRuns = async (input: {
  ctx: { tenant: Tenant };
  filter?: Filter<AiAgentRun> | undefined;
}) => adminListAiAgentRuns(input);

const updateAiAgentRun = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: PartialWithUndefined<Omit<AiAgentRun, ExcludedUpdateModelFields>>;
}) => adminUpdateAiAgentRun(input);

const makeAiAgentRunService = () => ({
  adminList: adminListAiAgentRuns,
  adminUpdate: adminUpdateAiAgentRun,
  create: createAiAgentRun,
  get: getAiAgentRun,
  list: listAiAgentRuns,
  update: updateAiAgentRun,
});

export { makeAiAgentRunService };
