import type { Filter } from "mongodb";

import { err, ok } from "neverthrow";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type { TenantAware } from "@/shared/tenant/tenant-model";

import { aiAgentRunMessageRepository } from "@/module/ai-agent-run-message/ai-agent-run-message-repository";
import { newModel } from "@/shared/model/model";

const createAiAgentRunMessage = async (input: {
  ctx: TenantAware;
  payload: Omit<
    AiAgentRunMessage,
    "id" | "_version" | "createdAt" | "updatedAt"
  >;
}) => {
  const { ctx, payload } = input;

  const model = newModel(payload);
  const insertResult = await aiAgentRunMessageRepository.insert({
    ctx,
    data: model,
  });

  if (insertResult.isErr()) {
    return err(insertResult.error);
  }
  return ok({ data: model });
};

const listAiAgentRunMessages = async (input: {
  ctx: TenantAware;
  filter?: Filter<AiAgentRunMessage> | undefined;
}) => {
  const { ctx, filter } = input;
  return aiAgentRunMessageRepository.findMany({ ctx, filter });
};

const makeAiAgentRunMessageService = () => ({
  create: createAiAgentRunMessage,
  list: listAiAgentRunMessages,
});

export { makeAiAgentRunMessageService };
