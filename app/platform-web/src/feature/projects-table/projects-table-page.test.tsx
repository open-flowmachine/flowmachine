import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/module/project/project-type";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";
import ProjectsTablePage from "./projects-table-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/project",
}));

const projectHandler = makeProjectMswHandler();

const PROJECT_1: Project = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  name: "Alpha Project",
};

const PROJECT_2: Project = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-20T14:00:00.000Z",
  name: "Beta Project",
  integration: {
    domain: "example.atlassian.net",
    externalId: "10001",
    externalKey: "BETA",
    provider: "jira",
    webhookSecret: "secret",
    credentialId: "01961a2b-0000-7000-8000-000000000050",
  },
};

describe("ProjectsTablePage", () => {
  it("renders project list from API", async () => {
    const listHandler = projectHandler.list({ data: [PROJECT_1, PROJECT_2] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Alpha Project")).toBeVisible();
    expect(screen.getByText("Beta Project")).toBeVisible();
  });

  it("renders the page heading", async () => {
    const listHandler = projectHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    await waitFor(() => {
      expect(screen.getByText("Project")).toBeVisible();
    });
  });

  it("renders the New Project button", async () => {
    const listHandler = projectHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("New Project")).toBeVisible();
  });

  it("shows 'No results.' when project list is empty", async () => {
    const listHandler = projectHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("No results.")).toBeVisible();
  });

  it("renders column headers", async () => {
    const listHandler = projectHandler.list({ data: [PROJECT_1] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    await screen.findByText("Alpha Project");

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.getByText("Created")).toBeVisible();
  });

  it("renders formatted created date", async () => {
    const listHandler = projectHandler.list({ data: [PROJECT_1] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
  });

  it("renders project name as a link to the project detail page", async () => {
    const listHandler = projectHandler.list({ data: [PROJECT_1] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    const link = await screen.findByRole("link", { name: "Alpha Project" });
    expect(link).toHaveAttribute("href", `/platform/project/${PROJECT_1.id}`);
  });

  it("renders the New Project button linking to /platform/project/new", async () => {
    const listHandler = projectHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<ProjectsTablePage />);

    listHandler.resolveRequest();

    const button = await screen.findByRole("button", { name: /New Project/i });
    expect(button).toHaveAttribute("href", "/platform/project/new");
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
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(listHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();

      expect(screen.getByText("Copy")).toBeVisible();
      expect(screen.getByText("Edit")).toBeVisible();
      expect(screen.getByText("Sync")).toBeVisible();
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

    it("copies project ID to clipboard and shows success toast", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(listHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Copy"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(PROJECT_1.id);
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

    it("edit menu item links to the project detail page", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(listHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();

      const editLink = screen.getByRole("menuitem", { name: /Edit/ });
      expect(editLink).toHaveAttribute(
        "href",
        `/platform/project/${PROJECT_1.id}`,
      );
    });
  });

  describe("sync action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("shows success toast on sync", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      const syncHandler = projectHandler.syncById();
      mswServer.use(listHandler, syncHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Sync"));

      syncHandler.resolveRequest();

      expect(
        await screen.findByText("Project synced successfully"),
      ).toBeVisible();
    });

    it("shows error toast when sync fails", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(
        listHandler,
        http.post("http://localhost:8000/api/v1/project/:id/sync", () =>
          HttpResponse.json(
            { status: 500, code: "error", message: "error" },
            { status: 500 },
          ),
        ),
      );

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Sync"));

      expect(await screen.findByText("Failed to sync project")).toBeVisible();
    });

    it("shows 'Syncing...' while sync is in progress", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      const syncHandler = projectHandler.syncById();
      mswServer.use(listHandler, syncHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Sync"));

      // Wait for menu to close, then reopen to check loading state
      await waitFor(() => {
        const menu = screen.queryByRole("menu");
        if (menu) expect(menu).not.toBeVisible();
      });
      await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(await screen.findByText("Syncing...")).toBeVisible();

      syncHandler.resolveRequest();
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
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(listHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      expect(await screen.findByText("Delete project")).toBeVisible();
    });

    it("confirmation dialog shows project name in description", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(listHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete project");
      expect(
        screen.getByText(/Are you sure you want to delete/),
      ).toHaveTextContent("Alpha Project");
    });

    it("confirming deletion calls API and closes dialog", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      const deleteHandler = projectHandler.deleteById();
      mswServer.use(listHandler, deleteHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete project");
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete project"),
      );
    });

    it("canceling deletion closes the dialog", async () => {
      const listHandler = projectHandler.list({ data: [PROJECT_1] });
      mswServer.use(listHandler);

      testRender(<ProjectsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete project");
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByText("Delete project")).toBeNull();
    });

    it("shows 'Deleting...' and disables buttons while deletion is in progress", async () => {
      const projectListHandler = projectHandler.list({ data: [PROJECT_1] });
      const deleteProjectHandler = projectHandler.deleteById();

      mswServer.use(projectListHandler, deleteProjectHandler);

      testRender(<ProjectsTablePage />);

      projectListHandler.resolveRequest();

      await screen.findByText("Alpha Project");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete project");
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Deleting...")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      deleteProjectHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete project"),
      );
    });
  });
});
