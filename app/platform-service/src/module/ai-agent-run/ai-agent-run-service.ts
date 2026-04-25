import { UTCDate } from "@date-fns/utc";
import { err, ok } from "neverthrow";

import type {
  AiAgentRun,
  AiAgentRunStatus,
} from "@/module/ai-agent-run/ai-agent-run-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import { aiAgentRunRepository } from "@/module/ai-agent-run/ai-agent-run-repository";
import { aiAgentRunTerminalStatuses } from "@/module/ai-agent-run/ai-agent-run-model";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";

const isTerminalStatus = (status: AiAgentRunStatus) =>
  (aiAgentRunTerminalStatuses as readonly AiAgentRunStatus[]).includes(status);

const createAiAgentRun = async (input: {
  ctx: { tenant: Tenant };
  payload: { aiAgentId: Id };
}) => {
  const { ctx, payload } = input;

  const existingResult = await aiAgentRunRepository.findMany({
    ctx,
    filter: { aiAgentId: payload.aiAgentId },
  });
  if (existingResult.isErr()) {
    return err(existingResult.error);
  }
  const hasNonTerminal = existingResult.value.data.some(
    (run) => !isTerminalStatus(run.status),
  );
  if (hasNonTerminal) {
    return err(
      Err.code("conflict", {
        message: "A non-terminal run already exists for this agent",
      }),
    );
  }

  const now = new UTCDate();
  const data: Omit<AiAgentRun, "id" | "_version" | "createdAt" | "updatedAt"> =
    {
      aiAgentId: payload.aiAgentId,
      status: "provisioning",
      sessionId: null,
      sandbox: null,
      startedAt: now,
      lastMessageAt: null,
      endedAt: null,
      endedReason: null,
    };
  const model = newModel(data);
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
  filter?: { aiAgentId?: Id };
}) => {
  const { ctx, filter } = input;
  return aiAgentRunRepository.findMany({
    ctx,
    filter: filter?.aiAgentId ? { aiAgentId: filter.aiAgentId } : undefined,
  });
};

const updateAiAgentRun = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<Omit<AiAgentRun, ExcludedUpdateModelFields>>;
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

const markProcessing = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  const findResult = await aiAgentRunRepository.findById({ ctx, id });
  if (findResult.isErr()) {
    return err(findResult.error);
  }
  const run = findResult.value.data;
  if (!run) {
    return err(Err.code("notFound"));
  }
  if (isTerminalStatus(run.status)) {
    return err(
      Err.code("notFound", { message: "Run is in a terminal state" }),
    );
  }
  if (run.status === "processing") {
    return err(
      Err.code("conflict", { message: "Run is already processing a turn" }),
    );
  }
  return aiAgentRunRepository.update({
    ctx,
    id,
    data: {
      status: "processing",
      lastMessageAt: new UTCDate(),
      _version: run._version,
    },
  });
};

const makeAiAgentRunService = () => ({
  create: createAiAgentRun,
  get: getAiAgentRun,
  list: listAiAgentRuns,
  update: updateAiAgentRun,
  markProcessing,
});

export { makeAiAgentRunService };
