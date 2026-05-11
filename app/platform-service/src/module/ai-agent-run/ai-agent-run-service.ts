import type { Filter } from "mongodb";

import { merge } from "es-toolkit";
import { err, ok } from "neverthrow";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type { Id } from "@/shared/model/model-id";
import type { TenantAware } from "@/shared/tenant/tenant-model";

import { aiAgentRunRepository } from "@/module/ai-agent-run/ai-agent-run-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";

const createAiAgentRun = async (input: {
  ctx: TenantAware;
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

const getAiAgentRun = async (input: { ctx: TenantAware; id: Id }) => {
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
  ctx: TenantAware;
  filter?: Filter<AiAgentRun> | undefined;
}) => {
  const { ctx, filter } = input;
  return aiAgentRunRepository.findMany({ ctx, filter });
};

const updateAiAgentRun = async (input: {
  ctx: TenantAware;
  id: Id;
  data: ExactPartial<Omit<AiAgentRun, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data: partialUpdatedData } = input;

  const findResult = await aiAgentRunRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }
  const currentData = findResult.value.data;

  return aiAgentRunRepository.update({
    ctx,
    id,
    data: merge(currentData, partialUpdatedData),
    expectedVersion: findResult.value.data._version,
  });
};

const makeAiAgentRunService = () => ({
  create: createAiAgentRun,
  get: getAiAgentRun,
  list: listAiAgentRuns,
  update: updateAiAgentRun,
});

export { makeAiAgentRunService };
