import type { Filter } from "mongodb";

import { err, ok } from "neverthrow";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant, TenantToggle } from "@/shared/model/model-tenant";

import { aiAgentRunMessageRepository } from "@/module/ai-agent-run-message/ai-agent-run-message-repository";
import { newModel } from "@/shared/model/model";

const adminListAiAgentRunMessages = async (input: {
  ctx: TenantToggle<{ tenant: Tenant }>;
  filter?: Filter<AiAgentRunMessage>;
}) => {
  const { ctx, filter } = input;
  return aiAgentRunMessageRepository.findMany({ ctx, filter });
};

const createAiAgentRunMessage = async (input: {
  ctx: { tenant: Tenant };
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
  ctx: { tenant: Tenant };
  filter: { aiAgentRunId: Id };
}) => adminListAiAgentRunMessages(input);

const makeAiAgentRunMessageService = () => ({
  adminList: adminListAiAgentRunMessages,
  create: createAiAgentRunMessage,
  list: listAiAgentRunMessages,
});

export { makeAiAgentRunMessageService };
