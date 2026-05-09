import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Tenant } from "@/shared/tenant/tenant-model";

import { aiAgentRunMessageRepository } from "@/module/ai-agent-run-message/ai-agent-run-message-repository";
import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000099" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(aiAgentRunMessageRepository, "findMany"),
  findById: spyOn(aiAgentRunMessageRepository, "findById"),
  insert: spyOn(aiAgentRunMessageRepository, "insert"),
  update: spyOn(aiAgentRunMessageRepository, "update"),
  deleteById: spyOn(aiAgentRunMessageRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

const service = makeAiAgentRunMessageService();

const resetMocks = () => {
  mockRepository.findMany.mockReset();
  mockRepository.findById.mockReset();
  mockRepository.insert.mockReset();
  mockRepository.update.mockReset();
  mockRepository.deleteById.mockReset();
  newIdSpy.mockReset();
  newIdSpy.mockReturnValue(NEW_ID);
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  mockRepository.findMany.mockRestore();
  mockRepository.findById.mockRestore();
  mockRepository.insert.mockRestore();
  mockRepository.update.mockRestore();
  mockRepository.deleteById.mockRestore();
  newIdSpy.mockRestore();
});

test("append: given a valid payload, when inserted, then returns the new message", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await service.create({
    ctx,
    payload: {
      aiAgentRunId: RUN_ID,
      role: "user",
      content: "hello",
      toolName: null,
      toolInput: null,
      toolResult: null,
    },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual(
    expect.objectContaining({
      data: expect.objectContaining({
        id: NEW_ID,
        aiAgentRunId: RUN_ID,
        role: "user",
        content: "hello",
      }),
    }) as never,
  );
});

test("append: given the repository fails, when inserted, then returns the err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await service.create({
    ctx,
    payload: {
      aiAgentRunId: RUN_ID,
      role: "user",
      content: "hello",
      toolName: null,
      toolInput: null,
      toolResult: null,
    },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given an aiAgentRunId filter, when called, then forwards the filter", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  await service.list({ ctx, filter: { aiAgentRunId: RUN_ID } });

  // then
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { aiAgentRunId: RUN_ID },
  });
});
