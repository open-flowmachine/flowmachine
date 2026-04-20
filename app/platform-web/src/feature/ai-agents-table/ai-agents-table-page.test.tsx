import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

import { makeAiAgentMswHandler } from "@/test/msw/msw-ai-agent-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import AiAgentsTablePage from "./ai-agents-table-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/ai-agent",
}));

const aiAgentHandler = makeAiAgentMswHandler();

const AI_AGENT_1: AiAgent = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  name: "Alpha Agent",
  model: "anthropic/claude-opus-4.6",
  projects: [],
};

const AI_AGENT_2: AiAgent = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-20T14:00:00.000Z",
  name: "Beta Agent",
  model: "anthropic/claude-sonnet-4.6",
  projects: [{ id: "01961a2b-0000-7000-8000-000000000010" }],
};

const originalClipboard = navigator.clipboard;

afterEach(() => {
  Object.assign(navigator, { clipboard: originalClipboard });
});

const openActionsMenu = async () => {
  const menuButton = await screen.findByRole("button", {
    name: "Open menu",
  });
  await userEvent.click(menuButton);
  await screen.findByRole("menu");
};

test("AiAgentsTablePage: given a list of AI agents, when the page loads, then it renders the AI agents from the API", async () => {
  // given
  const listHandler = aiAgentHandler.list({
    data: [AI_AGENT_1, AI_AGENT_2],
  });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Alpha Agent")).toBeVisible();
  expect(screen.getByText("Beta Agent")).toBeVisible();
});

test("AiAgentsTablePage: given the page loads, when the list resolves, then it renders the page heading", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("AI Agent")).toBeVisible();
});

test("AiAgentsTablePage: given the page loads, when the list resolves, then it renders the New AI Agent button", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("New AI Agent")).toBeVisible();
});

test("AiAgentsTablePage: given an empty AI agent list, when the list resolves, then it shows 'No results.'", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("No results.")).toBeVisible();
});

test("AiAgentsTablePage: given a list with one AI agent, when the list resolves, then it renders column headers", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");

  // then
  expect(screen.getByText("Name")).toBeVisible();
  expect(screen.getByText("Model")).toBeVisible();
  expect(screen.getByText("Created")).toBeVisible();
});

test("AiAgentsTablePage: given an AI agent with a createdAt timestamp, when the list resolves, then it renders the formatted created date", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("AiAgentsTablePage: given an AI agent in the list, when the list resolves, then it renders the agent name as a link to the detail page", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  const link = await screen.findByRole("link", { name: "Alpha Agent" });
  expect(link).toHaveAttribute("href", `/platform/ai-agent/${AI_AGENT_1.id}`);
});

test("AiAgentsTablePage: given the page loads, when the list resolves, then the New AI Agent button links to /platform/ai-agent/new", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();

  // then
  const button = await screen.findByRole("button", {
    name: /New AI Agent/i,
  });
  expect(button).toHaveAttribute("href", "/platform/ai-agent/new");
});

test("AiAgentsTablePage: given an AI agent in the list, when the actions menu is opened, then it shows all menu items", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");

  // when
  await openActionsMenu();

  // then
  expect(screen.getByText("Copy")).toBeVisible();
  expect(screen.getByText("Edit")).toBeVisible();
  expect(screen.getByText("Delete")).toBeVisible();
});

test("AiAgentsTablePage: given the clipboard is stubbed and the actions menu is open, when Copy is clicked, then it copies the AI agent ID to clipboard and shows a success toast", async () => {
  // given
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Copy"));

  // then
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(AI_AGENT_1.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();
});

test("AiAgentsTablePage: given an AI agent row, when the Edit menu item renders, then its href points to the edit page", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();

  // when
  const editLink = screen.getByRole("menuitem", { name: /Edit/ });

  // then
  expect(editLink).toHaveAttribute(
    "href",
    `/platform/ai-agent/${AI_AGENT_1.id}`,
  );
});

test("AiAgentsTablePage: given an AI agent in the list and the actions menu is open, when Delete is clicked, then it opens the confirmation dialog", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));

  // then
  expect(await screen.findByText("Delete AI agent")).toBeVisible();
});

test("AiAgentsTablePage: given the delete dialog is open, when it appears, then it shows the AI agent name in the description", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete AI agent");

  // then
  expect(
    screen.getByText(/Are you sure you want to delete/),
  ).toHaveTextContent("Alpha Agent");
});

test("AiAgentsTablePage: given the delete dialog is open, when deletion is confirmed, then it calls the API and closes the dialog", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  const deleteHandler = aiAgentHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete AI agent");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  deleteHandler.resolveRequest();

  // then
  await waitForElementToBeRemoved(() =>
    screen.queryByText("Delete AI agent"),
  );
});

test("AiAgentsTablePage: given the delete dialog is open, when Cancel is clicked, then it closes the dialog", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  mswServer.use(listHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete AI agent");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.queryByText("Delete AI agent")).toBeNull();
});

test("AiAgentsTablePage: given the delete dialog is open, when deletion is in progress, then it shows 'Deleting...' and disables buttons", async () => {
  // given
  const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
  const deleteHandler = aiAgentHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<AiAgentsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Agent");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete AI agent");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));

  // then
  expect(await screen.findByText("Deleting...")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

  deleteHandler.resolveRequest();

  await waitForElementToBeRemoved(() =>
    screen.queryByText("Delete AI agent"),
  );
});
