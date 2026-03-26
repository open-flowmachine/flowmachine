import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("AiAgentsTablePage", () => {
  it("renders AI agent list from API", async () => {
    const listHandler = aiAgentHandler.list({
      data: [AI_AGENT_1, AI_AGENT_2],
    });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Alpha Agent")).toBeVisible();
    expect(screen.getByText("Beta Agent")).toBeVisible();
  });

  it("renders the page heading", async () => {
    const listHandler = aiAgentHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    await waitFor(() => {
      expect(screen.getByText("AI Agent")).toBeVisible();
    });
  });

  it("renders the New AI Agent button", async () => {
    const listHandler = aiAgentHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("New AI Agent")).toBeVisible();
  });

  it("shows 'No results.' when AI agent list is empty", async () => {
    const listHandler = aiAgentHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("No results.")).toBeVisible();
  });

  it("renders column headers", async () => {
    const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    await screen.findByText("Alpha Agent");

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.getByText("Model")).toBeVisible();
    expect(screen.getByText("Created")).toBeVisible();
  });

  it("renders formatted created date", async () => {
    const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
  });

  it("renders AI agent name as a link to the detail page", async () => {
    const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    const link = await screen.findByRole("link", { name: "Alpha Agent" });
    expect(link).toHaveAttribute(
      "href",
      `/platform/ai-agent/${AI_AGENT_1.id}`,
    );
  });

  it("renders the New AI Agent button linking to /platform/ai-agent/new", async () => {
    const listHandler = aiAgentHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<AiAgentsTablePage />);

    listHandler.resolveRequest();

    const button = await screen.findByRole("button", {
      name: /New AI Agent/i,
    });
    expect(button).toHaveAttribute("href", "/platform/ai-agent/new");
  });

  describe("actions dropdown menu", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("opens the dropdown and shows all menu items", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      mswServer.use(listHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();

      expect(screen.getByText("Copy")).toBeVisible();
      expect(screen.getByText("Edit")).toBeVisible();
      expect(screen.getByText("Delete")).toBeVisible();
    });
  });

  describe("copy action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    const originalClipboard = navigator.clipboard;

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    afterEach(() => {
      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it("copies AI agent ID to clipboard and shows success toast", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      mswServer.use(listHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Copy"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        AI_AGENT_1.id,
      );
      expect(await screen.findByText("Copied to clipboard")).toBeVisible();
    });
  });

  describe("edit action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("edit menu item links to the AI agent detail page", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      mswServer.use(listHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();

      const editLink = screen.getByRole("menuitem", { name: /Edit/ });
      expect(editLink).toHaveAttribute(
        "href",
        `/platform/ai-agent/${AI_AGENT_1.id}`,
      );
    });
  });

  describe("delete action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("clicking Delete opens the confirmation dialog", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      mswServer.use(listHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      expect(await screen.findByText("Delete AI agent")).toBeVisible();
    });

    it("confirmation dialog shows AI agent name in description", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      mswServer.use(listHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete AI agent");
      expect(
        screen.getByText(/Are you sure you want to delete/),
      ).toHaveTextContent("Alpha Agent");
    });

    it("confirming deletion calls API and closes dialog", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      const deleteHandler = aiAgentHandler.deleteById();
      mswServer.use(listHandler, deleteHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete AI agent");
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete AI agent"),
      );
    });

    it("canceling deletion closes the dialog", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      mswServer.use(listHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete AI agent");
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByText("Delete AI agent")).toBeNull();
    });

    it("shows 'Deleting...' and disables buttons while deletion is in progress", async () => {
      const listHandler = aiAgentHandler.list({ data: [AI_AGENT_1] });
      const deleteHandler = aiAgentHandler.deleteById();

      mswServer.use(listHandler, deleteHandler);

      testRender(<AiAgentsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Agent");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete AI agent");
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Deleting...")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete AI agent"),
      );
    });
  });
});
