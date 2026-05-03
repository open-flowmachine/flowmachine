import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import type { AiAgent } from "@/module/ai-agent/ai-agent-type";
import type { Project } from "@/module/project/project-type";

import { makeAiAgentMswHandler } from "@/test/msw/msw-ai-agent-handler";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { EditableAiAgentDetailsPage } from "./editable-ai-agent-details-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/ai-agent/01961a2b-0000-7000-8000-000000000001",
}));

const aiAgentHandler = makeAiAgentMswHandler();
const projectHandler = makeProjectMswHandler();

const PROJECT_1: Project = {
  id: "01961a2b-0000-7000-8000-000000000010",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  name: "Test Project",
};

const AI_AGENT_WITHOUT_PROJECTS: AiAgent = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-20T14:00:00.000Z",
  name: "Alpha Agent",
  model: "claude-opus-4-7",
  projects: [],
};

const AI_AGENT_WITH_PROJECTS: AiAgent = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-25T16:30:00.000Z",
  name: "Beta Agent",
  model: "claude-sonnet-4-6",
  projects: [{ id: PROJECT_1.id }],
};

const setupProjectList = (projects: Project[] = []) => {
  const listHandler = projectHandler.list({ data: projects });
  mswServer.use(listHandler);
  listHandler.resolveRequest();
};

const waitForAgentToLoad = async () => {
  await screen.findByRole("button", { name: "Edit" });
};

test("EditableAiAgentDetailsPage: given an AI agent with no projects, when the page loads, then renders agent name as page heading", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();

  // then
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Alpha Agent",
  );
});

test("EditableAiAgentDetailsPage: given an AI agent, when the page loads, then displays the agent ID", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText(AI_AGENT_WITHOUT_PROJECTS.id)).toBeVisible();
});

test("EditableAiAgentDetailsPage: given an AI agent, when the page loads, then displays agent name in details", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();

  // then
  const nameElements = screen.getAllByText("Alpha Agent");
  expect(nameElements.length).toBeGreaterThanOrEqual(2);
});

test("EditableAiAgentDetailsPage: given an AI agent with no projects, when the page loads, then displays No projects assigned", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("No projects assigned")).toBeVisible();
});

test("EditableAiAgentDetailsPage: given an AI agent, when the page loads, then displays formatted created at timestamp", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("EditableAiAgentDetailsPage: given an AI agent, when the page loads, then displays formatted updated at timestamp", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
});

test("EditableAiAgentDetailsPage: given an AI agent, when the page loads, then renders Edit button", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableAiAgentDetailsPage: given an AI agent with assigned projects, when the page loads, then displays assigned project name", async () => {
  // given
  setupProjectList([PROJECT_1]);
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITH_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITH_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();

  // then
  expect(screen.getByText("Test Project")).toBeVisible();
});

test("EditableAiAgentDetailsPage: given a non-existent agent ID, when the API returns an error, then shows 404 Not Found", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableAiAgentDetailsPage id="non-existent-id" />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("404 - Not Found")).toBeVisible();
});

test("EditableAiAgentDetailsPage: given clipboard is available and the page has loaded, when the copy button is clicked, then copies agent ID to clipboard and shows toast", async () => {
  // given
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText },
  });

  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Copy ID" }));

  // then
  expect(writeText).toHaveBeenCalledWith(AI_AGENT_WITHOUT_PROJECTS.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();

  Object.assign(navigator, { clipboard: originalClipboard });
});

test("EditableAiAgentDetailsPage: given the page has loaded, when Edit is clicked, then switches to edit form", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("EditableAiAgentDetailsPage: given the edit form is open, when rendered, then is pre-populated with AI agent data", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await screen.findByRole("button", { name: "Edit" });

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("Alpha Agent");
});

test("EditableAiAgentDetailsPage: given the edit form is open, when Cancel is clicked, then returns to view mode", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Name")).toBeVisible();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableAiAgentDetailsPage: given a valid update, when Save is clicked and succeeds, then shows toast and returns to view mode", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  const updateHandler = aiAgentHandler.updateById();
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "Updated Agent");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  updateHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("AI Agent updated successfully"),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
});

test("EditableAiAgentDetailsPage: given an update that fails, when Save is clicked, then shows error toast", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  const updateHandler = aiAgentHandler.updateById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  updateHandler.resolveRequest();

  // then
  expect(await screen.findByText("Failed to update AI Agent")).toBeVisible();
});

test("EditableAiAgentDetailsPage: given Save is clicked, when update is in progress, then shows Saving...", async () => {
  // given
  setupProjectList();
  const getByIdHandler = aiAgentHandler.getById({
    data: AI_AGENT_WITHOUT_PROJECTS,
  });
  const updateHandler = aiAgentHandler.updateById();
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />);
  getByIdHandler.resolveRequest();
  await waitForAgentToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  updateHandler.resolveRequest();
});
