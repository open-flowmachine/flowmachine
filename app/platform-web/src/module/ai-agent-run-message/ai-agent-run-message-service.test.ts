import { expect, test } from "vitest";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-type";

import { makeAiAgentRunMessageService } from "@/module/ai-agent-run-message/ai-agent-run-message-service";

const baseMessage: AiAgentRunMessage = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  aiAgentRunId: "01961a2b-0000-7000-8000-000000000002",
  role: "user",
  content: "Hello",
  toolName: null,
  toolInput: null,
  toolResult: null,
};

test("makeAiAgentRunMessageService: given a tool_use message, when isCollapsible is called, then it returns true", () => {
  // given
  const service = makeAiAgentRunMessageService({
    message: { ...baseMessage, role: "tool_use", toolName: "Edit" },
  });

  // when
  const result = service.isCollapsible();

  // then
  expect(result).toBe(true);
});

test("makeAiAgentRunMessageService: given a user message, when isCollapsible is called, then it returns false", () => {
  // given
  const service = makeAiAgentRunMessageService({ message: baseMessage });

  // when
  const result = service.isCollapsible();

  // then
  expect(result).toBe(false);
});

test("makeAiAgentRunMessageService: given a tool_use message with toolName, when getToolLabel is called, then it returns the tool name", () => {
  // given
  const service = makeAiAgentRunMessageService({
    message: { ...baseMessage, role: "tool_use", toolName: "Edit" },
  });

  // when
  const result = service.getToolLabel();

  // then
  expect(result).toBe("Edit");
});

test("makeAiAgentRunMessageService: given a tool_use message with toolInput, when getToolPayload is called, then it returns the toolInput", () => {
  // given
  const toolInput = { path: "src/foo.ts" };
  const service = makeAiAgentRunMessageService({
    message: {
      ...baseMessage,
      role: "tool_use",
      toolName: "Edit",
      toolInput,
    },
  });

  // when
  const result = service.getToolPayload();

  // then
  expect(result).toEqual(toolInput);
});

test("makeAiAgentRunMessageService: given a tool_result message with toolResult, when getToolPayload is called, then it returns the toolResult", () => {
  // given
  const toolResult = { ok: true };
  const service = makeAiAgentRunMessageService({
    message: {
      ...baseMessage,
      role: "tool_result",
      toolResult,
    },
  });

  // when
  const result = service.getToolPayload();

  // then
  expect(result).toEqual(toolResult);
});

test("makeAiAgentRunMessageService: given an assistant message, when getToolPayload is called, then it returns null", () => {
  // given
  const service = makeAiAgentRunMessageService({
    message: { ...baseMessage, role: "assistant" },
  });

  // when
  const result = service.getToolPayload();

  // then
  expect(result).toBeNull();
});
