import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import type { GitRepository, GitRepositoryProject } from "@/module/git-repository/git-repository-type";

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
  projects: [] as GitRepositoryProject[],
  tenant: { id: "01961a2b-0000-7000-8000-000000000100", type: "organization" },
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
  projects: [] as GitRepositoryProject[],
  tenant: { id: "01961a2b-0000-7000-8000-000000000100", type: "organization" },
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

test("GitRepositoriesTablePage: given a list of repositories, when the page loads, then it renders the repositories from the API", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({
    data: [REPO_1, REPO_2],
  });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("alpha-repo")).toBeVisible();
  expect(screen.getByText("beta-repo")).toBeVisible();
});

test("GitRepositoriesTablePage: given the page loads, when the list resolves, then it renders the page heading", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Git Repository")).toBeVisible();
});

test("GitRepositoriesTablePage: given the page loads, when the list resolves, then it renders the Add Repository button", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Add Repository")).toBeVisible();
});

test("GitRepositoriesTablePage: given an empty repository list, when the list resolves, then it shows 'No results.'", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("No results.")).toBeVisible();
});

test("GitRepositoriesTablePage: given a list with one repository, when the list resolves, then it renders column headers", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");

  // then
  expect(screen.getByText("Name")).toBeVisible();
  expect(screen.getByText("URL")).toBeVisible();
  expect(screen.getByText("Provider")).toBeVisible();
  expect(screen.getByText("Branch")).toBeVisible();
  expect(screen.getByText("Created")).toBeVisible();
});

test("GitRepositoriesTablePage: given a repository with a createdAt timestamp, when the list resolves, then it renders the formatted created date", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("GitRepositoriesTablePage: given a repository in the list, when the list resolves, then it renders the repository name as a link to the detail page", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  const link = await screen.findByRole("link", { name: "alpha-repo" });
  expect(link).toHaveAttribute(
    "href",
    `/platform/git-repository/${REPO_1.id}`,
  );
});

test("GitRepositoriesTablePage: given the page loads, when the list resolves, then the Add Repository button links to /platform/git-repository/new", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();

  // then
  const button = await screen.findByRole("button", {
    name: /Add Repository/i,
  });
  expect(button).toHaveAttribute("href", "/platform/git-repository/new");
});

test("GitRepositoriesTablePage: given a repository in the list, when the actions menu is opened, then it shows all menu items", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");

  // when
  await openActionsMenu();

  // then
  expect(screen.getByText("Copy")).toBeVisible();
  expect(screen.getByText("Edit")).toBeVisible();
  expect(screen.getByText("Delete")).toBeVisible();
});

test("GitRepositoriesTablePage: given the clipboard is stubbed and the actions menu is open, when Copy is clicked, then it copies the repository ID to clipboard and shows a success toast", async () => {
  // given
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText },
  });

  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Copy"));

  // then
  expect(writeText).toHaveBeenCalledWith(REPO_1.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();
});

test("GitRepositoriesTablePage: given a git repository row, when the Edit menu item renders, then its href points to the edit page", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();

  // when
  const editLink = screen.getByRole("menuitem", { name: /Edit/ });

  // then
  expect(editLink).toHaveAttribute(
    "href",
    `/platform/git-repository/${REPO_1.id}`,
  );
});

test("GitRepositoriesTablePage: given a repository in the list and the actions menu is open, when Delete is clicked, then it opens the confirmation dialog", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));

  // then
  expect(await screen.findByText("Delete repository")).toBeVisible();
});

test("GitRepositoriesTablePage: given the delete dialog is open, when it appears, then it shows the repository name in the description", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete repository");

  // then
  expect(
    screen.getByText(/Are you sure you want to delete/),
  ).toHaveTextContent("alpha-repo");
});

test("GitRepositoriesTablePage: given the delete dialog is open, when deletion is confirmed, then it calls the API and closes the dialog", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  const deleteHandler = gitRepositoryHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete repository");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  deleteHandler.resolveRequest();

  // then
  await waitForElementToBeRemoved(() =>
    screen.queryByText("Delete repository"),
  );
});

test("GitRepositoriesTablePage: given the delete dialog is open, when Cancel is clicked, then it closes the dialog", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  mswServer.use(listHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete repository");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.queryByText("Delete repository")).toBeNull();
});

test("GitRepositoriesTablePage: given the delete dialog is open, when deletion is in progress, then it shows 'Deleting...' and disables buttons", async () => {
  // given
  const listHandler = gitRepositoryHandler.list({ data: [REPO_1] });
  const deleteHandler = gitRepositoryHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<GitRepositoriesTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("alpha-repo");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete repository");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));

  // then
  expect(await screen.findByText("Deleting...")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

  deleteHandler.resolveRequest();

  await waitForElementToBeRemoved(() =>
    screen.queryByText("Delete repository"),
  );
});
