import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  model: "anthropic/claude-opus-4.6",
  projects: [],
};

const AI_AGENT_WITH_PROJECTS: AiAgent = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-25T16:30:00.000Z",
  name: "Beta Agent",
  model: "anthropic/claude-sonnet-4.6",
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

describe("EditableAiAgentDetailsPage", () => {
  describe("view mode", () => {
    it("renders AI agent name as page heading", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Alpha Agent",
      );
    });

    it("displays AI agent ID", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      expect(
        await screen.findByText(AI_AGENT_WITHOUT_PROJECTS.id),
      ).toBeVisible();
    });

    it("displays AI agent name in details", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();

      const nameElements = screen.getAllByText("Alpha Agent");
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it("displays 'No projects assigned' when projects are empty", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("No projects assigned")).toBeVisible();
    });

    it("displays formatted created at timestamp", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
    });

    it("displays formatted updated at timestamp", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
    });

    it("renders Edit button", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("displays assigned project name when projects are present", async () => {
      setupProjectList([PROJECT_1]);
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITH_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableAiAgentDetailsPage id={AI_AGENT_WITH_PROJECTS.id} />);

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();

      expect(screen.getByText("Test Project")).toBeVisible();
    });
  });

  describe("404 error", () => {
    it("shows 404 when API returns error", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        status: 500,
        code: "error",
        message: "error",
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableAiAgentDetailsPage id="non-existent-id" />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("404 - Not Found")).toBeVisible();
    });
  });

  describe("copy action", () => {
    const originalClipboard = navigator.clipboard;

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    afterEach(() => {
      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it("copies AI agent ID to clipboard and shows toast", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();

      const copyButtons = screen.getAllByRole("button");
      const copyButton = copyButtons.find((btn) =>
        btn.querySelector(".lucide-copy"),
      )!;
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        AI_AGENT_WITHOUT_PROJECTS.id,
      );
      expect(await screen.findByText("Copied to clipboard")).toBeVisible();
    });
  });

  describe("edit mode", () => {
    it("clicking Edit switches to edit form", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
    });

    it("edit form is pre-populated with AI agent data", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await screen.findByRole("button", { name: "Edit" });
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toHaveValue("Alpha Agent");
    });

    it("clicking Cancel returns to view mode", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("successful update shows toast and returns to view mode", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      const updateHandler = aiAgentHandler.updateById();
      mswServer.use(getByIdHandler, updateHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "Updated Agent");

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      updateHandler.resolveRequest();

      expect(
        await screen.findByText("AI Agent updated successfully"),
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("failed update shows error toast", async () => {
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

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();
      updateHandler.resolveRequest();

      await waitForAgentToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(
        await screen.findByText("Failed to update AI Agent"),
      ).toBeVisible();
    });

    it("shows 'Saving...' while update is in progress", async () => {
      setupProjectList();
      const getByIdHandler = aiAgentHandler.getById({
        data: AI_AGENT_WITHOUT_PROJECTS,
      });
      const updateHandler = aiAgentHandler.updateById();
      mswServer.use(getByIdHandler, updateHandler);

      testRender(
        <EditableAiAgentDetailsPage id={AI_AGENT_WITHOUT_PROJECTS.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForAgentToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Saving...")).toBeVisible();

      updateHandler.resolveRequest();
    });
  });
});
