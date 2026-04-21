import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

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

const openActionsMenu = async () => {
  const menuButton = await screen.findByRole("button", { name: "Open menu" });
  await userEvent.click(menuButton);
  await screen.findByRole("menu");
};

test("ProjectsTablePage: given a list of projects, when the page loads, then renders all project names", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1, PROJECT_2] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Alpha Project")).toBeVisible();
  expect(screen.getByText("Beta Project")).toBeVisible();
});

test("ProjectsTablePage: given the page loads, when rendered, then shows the page heading", async () => {
  // given
  const listHandler = projectHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  await waitFor(() => {
    expect(screen.getByText("Project")).toBeVisible();
  });
});

test("ProjectsTablePage: given the page loads, when rendered, then shows the New Project button", async () => {
  // given
  const listHandler = projectHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("New Project")).toBeVisible();
});

test("ProjectsTablePage: given an empty project list, when the page loads, then shows No results.", async () => {
  // given
  const listHandler = projectHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("No results.")).toBeVisible();
});

test("ProjectsTablePage: given a project exists, when the page loads, then renders column headers", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");

  // then
  expect(screen.getByText("Name")).toBeVisible();
  expect(screen.getByText("Created")).toBeVisible();
});

test("ProjectsTablePage: given a project exists, when the page loads, then renders formatted created date", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("ProjectsTablePage: given a project exists, when the page loads, then renders project name as link to detail page", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  const link = await screen.findByRole("link", { name: "Alpha Project" });
  expect(link).toHaveAttribute("href", `/platform/project/${PROJECT_1.id}`);
});

test("ProjectsTablePage: given the page loads, when rendered, then New Project button links to /platform/project/new", async () => {
  // given
  const listHandler = projectHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();

  // then
  const button = await screen.findByRole("button", { name: /New Project/i });
  expect(button).toHaveAttribute("href", "/platform/project/new");
});

test("ProjectsTablePage: given a project exists, when the actions menu is opened, then shows all menu items", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");

  // when
  await openActionsMenu();

  // then
  expect(screen.getByText("Copy")).toBeVisible();
  expect(screen.getByText("Edit")).toBeVisible();
  expect(screen.getByText("Sync")).toBeVisible();
  expect(screen.getByText("Delete")).toBeVisible();
});

test("ProjectsTablePage: given clipboard is available and the actions menu is open, when Copy is clicked, then copies project ID to clipboard and shows toast", async () => {
  // given
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText },
  });

  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Copy"));

  // then
  expect(writeText).toHaveBeenCalledWith(PROJECT_1.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();

  Object.assign(navigator, { clipboard: originalClipboard });
});

test("ProjectsTablePage: given a project exists and the actions menu is open, when Edit is clicked, then the menu item links to the project detail page", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");

  // when
  await openActionsMenu();

  // then
  const editLink = screen.getByRole("menuitem", { name: /Edit/ });
  expect(editLink).toHaveAttribute("href", `/platform/project/${PROJECT_1.id}`);
});

test("ProjectsTablePage: given a project exists, when Sync is clicked, then shows success toast", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  const syncHandler = projectHandler.syncById();
  mswServer.use(listHandler, syncHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Sync"));
  syncHandler.resolveRequest();

  // then
  expect(await screen.findByText("Project synced successfully")).toBeVisible();
});

test("ProjectsTablePage: given a sync failure, when Sync is clicked, then shows error toast", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  const syncHandler = projectHandler.syncById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(listHandler, syncHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Sync"));
  syncHandler.resolveRequest();

  // then
  expect(await screen.findByText("Failed to sync project")).toBeVisible();
});

test("ProjectsTablePage: given sync is in progress, when the menu is reopened, then shows Syncing... loading state", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  const syncHandler = projectHandler.syncById();
  mswServer.use(listHandler, syncHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Sync"));

  // Wait for menu to close, then reopen to check loading state
  await waitFor(() => {
    const menu = screen.queryByRole("menu");
    if (menu) expect(menu).not.toBeVisible();
  });
  await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

  // then
  expect(await screen.findByText("Syncing...")).toBeVisible();

  syncHandler.resolveRequest();
});

test("ProjectsTablePage: given a project exists and the actions menu is open, when Delete is clicked, then opens confirmation dialog", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));

  // then
  expect(await screen.findByText("Delete project")).toBeVisible();
});

test("ProjectsTablePage: given the delete dialog is open, when shown, then shows project name in description", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete project");

  // then
  expect(
    screen.getByText(/Are you sure you want to delete/),
  ).toHaveTextContent("Alpha Project");
});

test("ProjectsTablePage: given the delete dialog is open, when deletion is confirmed, then calls API and closes dialog", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  const deleteHandler = projectHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete project");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  deleteHandler.resolveRequest();

  // then
  await waitForElementToBeRemoved(() => screen.queryByText("Delete project"));
});

test("ProjectsTablePage: given the delete dialog is open, when Cancel is clicked, then closes the dialog", async () => {
  // given
  const listHandler = projectHandler.list({ data: [PROJECT_1] });
  mswServer.use(listHandler);

  testRender(<ProjectsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete project");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.queryByText("Delete project")).toBeNull();
});

test("ProjectsTablePage: given the delete dialog is open and deletion is confirmed, when deletion is in progress, then shows Deleting... and disables buttons", async () => {
  // given
  const projectListHandler = projectHandler.list({ data: [PROJECT_1] });
  const deleteProjectHandler = projectHandler.deleteById();
  mswServer.use(projectListHandler, deleteProjectHandler);

  testRender(<ProjectsTablePage />);
  projectListHandler.resolveRequest();
  await screen.findByText("Alpha Project");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete project");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));

  // then
  expect(await screen.findByText("Deleting...")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

  deleteProjectHandler.resolveRequest();
  await waitForElementToBeRemoved(() => screen.queryByText("Delete project"));
});
