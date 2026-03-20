import { err, ok } from "neverthrow";
import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import { aiAgentRepository } from "@/module/ai-agent/ai-agent-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

const createAiAgent = async (input: {
  ctx: { tenant: Tenant };
  payload: {
    name: string;
    model: AiAgent["model"];
    projects: AiAgent["projects"];
  };
}) => {
  const { ctx, payload } = input;

  const model = newModel({
    name: payload.name,
    model: payload.model,
    projects: payload.projects,
  });
  const result = await aiAgentRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getAiAgent = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
  const { ctx, id } = input;

  const result = await aiAgentRepository.findById({ ctx, id });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listAiAgents = async (input: { ctx: { tenant: Tenant } }) => {
  const { ctx } = input;

  return aiAgentRepository.findMany({ ctx });
};

const updateAiAgent = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<Omit<AiAgent, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await aiAgentRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return aiAgentRepository.update({ ctx, id, data });
};

const deleteAiAgent = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
  const { ctx, id } = input;

  return aiAgentRepository.deleteById({ ctx, id });
};

const makeAiAgentService = () => ({
  create: createAiAgent,
  get: getAiAgent,
  list: listAiAgents,
  update: updateAiAgent,
  delete: deleteAiAgent,
});

export { makeAiAgentService };
