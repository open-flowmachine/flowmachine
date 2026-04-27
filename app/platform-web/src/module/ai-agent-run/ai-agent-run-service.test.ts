import { expect, test } from "vitest";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";

import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";

const baseRun: AiAgentRun = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  aiAgentId: "01961a2b-0000-7000-8000-000000000002",
  status: "idle",
  sessionId: null,
  startedAt: "2026-01-15T10:30:00.000Z",
  lastMessageAt: null,
  endedAt: null,
  endedReason: null,
};

test("makeAiAgentRunService: given an idle run, when getStatusDisplayName is called, then it returns 'Idle'", () => {
  // given
  const service = makeAiAgentRunService({ run: baseRun });

  // when
  const result = service.getStatusDisplayName();

  // then
  expect(result).toBe("Idle");
});

test("makeAiAgentRunService: given a processing run, when getComposerHint is called, then it returns the working hint", () => {
  // given
  const service = makeAiAgentRunService({
    run: { ...baseRun, status: "processing" },
  });

  // when
  const result = service.getComposerHint();

  // then
  expect(result).toBe("Agent is working…");
});

test("makeAiAgentRunService: given an errored run with endedReason, when getEndedReasonDisplayName is called, then it returns the human label", () => {
  // given
  const service = makeAiAgentRunService({
    run: { ...baseRun, status: "errored", endedReason: "error" },
  });

  // when
  const result = service.getEndedReasonDisplayName();

  // then
  expect(result).toBe("Error");
});

test("makeAiAgentRunService: given a run with no endedReason, when getEndedReasonDisplayName is called, then it returns null", () => {
  // given
  const service = makeAiAgentRunService({ run: baseRun });

  // when
  const result = service.getEndedReasonDisplayName();

  // then
  expect(result).toBeNull();
});

test("makeAiAgentRunService: given a run with a startedAt timestamp, when getStartedAt is called, then it returns the formatted date", () => {
  // given
  const service = makeAiAgentRunService({ run: baseRun });

  // when
  const result = service.getStartedAt();

  // then
  expect(result).toBe("Jan 15, 2026, 10:30 AM");
});

test("makeAiAgentRunService: given a run with no lastMessageAt, when getLastMessageAt is called, then it returns null", () => {
  // given
  const service = makeAiAgentRunService({ run: baseRun });

  // when
  const result = service.getLastMessageAt();

  // then
  expect(result).toBeNull();
});

test("makeAiAgentRunService: given a destructive variant trigger, when an errored run is passed, then getStatusBadgeVariant returns 'destructive'", () => {
  // given
  const service = makeAiAgentRunService({
    run: { ...baseRun, status: "errored" },
  });

  // when
  const result = service.getStatusBadgeVariant();

  // then
  expect(result).toBe("destructive");
});
