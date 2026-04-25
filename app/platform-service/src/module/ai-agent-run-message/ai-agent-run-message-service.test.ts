import { beforeEach, expect, mock, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Tenant } from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000099" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: mock(),
  findById: mock(),
  insert: mock(),
  update: mock(),
  deleteById: mock(),
};

mock.module(
  "@/module/ai-agent-run-message/ai-agent-run-message-repository",
  () => ({ aiAgentRunMessageRepository: mockRepository }),
);

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const { makeAiAgentRunMessageService } = await import(
  "./ai-agent-run-message-service"
);
const service = makeAiAgentRunMessageService();

const resetMocks = () => {
  mockRepository.findMany.mockClear();
  mockRepository.insert.mockClear();
};

// --- Tests ---

beforeEach(resetMocks);

test("append: given a valid payload, when inserted, then returns the new message", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await service.append({
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
  const result = await service.append({
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
