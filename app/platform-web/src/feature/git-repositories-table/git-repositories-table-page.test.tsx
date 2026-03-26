import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GitRepository } from "@/module/git-repository/git-repository-type";
import { makeGitRepositoryMswHandler } from "@/test/msw/msw-git-repository-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";
import GitRepositoriesTablePage from "./git-repositories-table-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/git-repository",
}));

const gitRepositoryHandler = makeGitRepositoryMswHandler();

const REPO_1: GitRepository = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  name: "alpha-repo",
  url: "https://github.com/owner/alpha.git",
  config: {
    defaultBranch: "main",
    email: "alpha@example.com",
    username: "alpha-user",
  },
  integration: {
    provider: "github",
    credentialId: "01961a2b-0000-7000-8000-000000000050",
  },
  projects: [],
};

const REPO_2: GitRepository = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-20T14:00:00.000Z",
  name: "beta-repo",
  url: "https://gitlab.com/owner/beta.git",
  config: {
    defaultBranch: "develop",
    email: "beta@example.com",
    username: "beta-user",
  },
  integration: {
    provider: "gitlab",
    credentialId: "01961a2b-0000-7000-8000-000000000051",
  },
  projects: [],
};

describe("GitRepositoriesTablePage", () => {
  it("renders repository list from API", async () => {
    const listHandler = gitRepositoryHandler.list({
      data: [REPO_1, REPO_2],
    });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("alpha-repo")).toBeVisible();
    expect(screen.getByText("beta-repo")).toBeVisible();
  });

  it("renders the page heading", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    await waitFor(() => {
      expect(screen.getByText("Git Repository")).toBeVisible();
    });
  });

  it("renders the Add Repository button", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Add Repository")).toBeVisible();
  });

  it("shows 'No results.' when repository list is empty", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("No results.")).toBeVisible();
  });

  it("renders column headers", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    await screen.findByText("alpha-repo");

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.getByText("URL")).toBeVisible();
    expect(screen.getByText("Provider")).toBeVisible();
    expect(screen.getByText("Branch")).toBeVisible();
    expect(screen.getByText("Created")).toBeVisible();
  });

  it("renders formatted created date", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
  });

  it("renders repository name as a link to the detail page", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    const link = await screen.findByRole("link", { name: "alpha-repo" });
    expect(link).toHaveAttribute(
      "href",
      `/platform/git-repository/${REPO_1.id}`,
    );
  });

  it("renders the Add Repository button linking to /platform/git-repository/new", async () => {
    const listHandler = gitRepositoryHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<GitRepositoriesTablePage />);

    listHandler.resolveRequest();

    const button = await screen.findByRole("button", {
      name: /Add Repository/i,
    });
    expect(button).toHaveAttribute("href", "/platform/git-repository/new");
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
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      mswServer.use(listHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
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

    it("copies repository ID to clipboard and shows success toast", async () => {
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      mswServer.use(listHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Copy"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(REPO_1.id);
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

    it("edit menu item links to the repository detail page", async () => {
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      mswServer.use(listHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();

      const editLink = screen.getByRole("menuitem", { name: /Edit/ });
      expect(editLink).toHaveAttribute(
        "href",
        `/platform/git-repository/${REPO_1.id}`,
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
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      mswServer.use(listHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      expect(await screen.findByText("Delete repository")).toBeVisible();
    });

    it("confirmation dialog shows repository name in description", async () => {
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      mswServer.use(listHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete repository");
      expect(
        screen.getByText(/Are you sure you want to delete/),
      ).toHaveTextContent("alpha-repo");
    });

    it("confirming deletion calls API and closes dialog", async () => {
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      const deleteHandler = gitRepositoryHandler.deleteById();
      mswServer.use(listHandler, deleteHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete repository");
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete repository"),
      );
    });

    it("canceling deletion closes the dialog", async () => {
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      mswServer.use(listHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete repository");
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByText("Delete repository")).toBeNull();
    });

    it("shows 'Deleting...' and disables buttons while deletion is in progress", async () => {
      const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
      const deleteHandler = gitRepositoryHandler.deleteById();

      mswServer.use(listHandler, deleteHandler);

      testRender(<GitRepositoriesTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("alpha-repo");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      await screen.findByText("Delete repository");
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Deleting...")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete repository"),
      );
    });
  });
});
