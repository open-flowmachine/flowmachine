import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

import { AiAgentRunsTablePage } from "@/feature/ai-agent-runs-table/ai-agent-runs-table-page";
import { makeAiAgentMswHandler } from "@/test/msw/msw-ai-agent-handler";
import { makeAiAgentRunMswHandler } from "@/test/msw/msw-ai-agent-run-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () =>
    "/platform/ai-agent/01961a2b-0000-7000-8000-000000000001/run",
}));

const aiAgentHandler = makeAiAgentMswHandler();
const aiAgentRunHandler = makeAiAgentRunMswHandler();

const AGENT_ID = "01961a2b-0000-7000-8000-000000000001";
const RUN_ID = "01961a2b-0000-7000-8000-000000000010";

const AGENT: AiAgent = {
  id: AGENT_ID,
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  name: "Alpha Agent",
  model: "claude-opus-4-7",
  projects: [],
};

const RUN: AiAgentRun = {
  id: RUN_ID,
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  aiAgentId: AGENT_ID,
  status: "idle",
  sessionId: null,
  startedAt: "2026-01-15T10:30:00.000Z",
  lastMessageAt: null,
  endedAt: null,
  endedReason: null,
};

test("AiAgentRunsTablePage: given a list of runs, when the page loads, then it renders rows with status badges", async () => {
  // given
  const agentHandler = aiAgentHandler.getById({ data: AGENT });
  const listHandler = aiAgentRunHandler.list({ data: [RUN] });
  mswServer.use(agentHandler, listHandler);

  // when
  testRender(<AiAgentRunsTablePage aiAgentId={AGENT_ID} />);
  agentHandler.resolveRequest();
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Idle")).toBeVisible();
  expect(screen.getByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("AiAgentRunsTablePage: given the page loads, when runs resolve, then it renders a New chat button", async () => {
  // given
  const agentHandler = aiAgentHandler.getById({ data: AGENT });
  const listHandler = aiAgentRunHandler.list({ data: [] });
  mswServer.use(agentHandler, listHandler);

  // when
  testRender(<AiAgentRunsTablePage aiAgentId={AGENT_ID} />);
  agentHandler.resolveRequest();
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("New chat")).toBeVisible();
});

test("AiAgentRunsTablePage: given an idle run exists, when the row link renders, then it points to the run chat URL", async () => {
  // given
  const agentHandler = aiAgentHandler.getById({ data: AGENT });
  const listHandler = aiAgentRunHandler.list({ data: [RUN] });
  mswServer.use(agentHandler, listHandler);

  // when
  testRender(<AiAgentRunsTablePage aiAgentId={AGENT_ID} />);
  agentHandler.resolveRequest();
  listHandler.resolveRequest();

  // then
  const link = await screen.findByRole("link", {
    name: "Jan 15, 2026, 10:30 AM",
  });
  expect(link).toHaveAttribute(
    "href",
    `/platform/ai-agent/${AGENT_ID}/run/${RUN_ID}`,
  );
});
