import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import type { GitRepository } from "@/module/git-repository/git-repository-type";
import type { Project } from "@/module/project/project-type";

import { makeGitRepositoryMswHandler } from "@/test/msw/msw-git-repository-handler";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { EditableGitRepositoryDetailsPage } from "./editable-git-repository-details-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () =>
    "/platform/git-repository/01961a2b-0000-7000-8000-000000000001",
}));

const gitRepositoryHandler = makeGitRepositoryMswHandler();
const projectHandler = makeProjectMswHandler();

const PROJECT: Project = {
  id: "01961a2b-0000-7000-8000-000000000010",
  createdAt: "2026-01-10T08:00:00.000Z",
  updatedAt: "2026-01-10T08:00:00.000Z",
  name: "Alpha Project",
};

const GIT_REPOSITORY: GitRepository = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-20T14:00:00.000Z",
  name: "my-repo",
  url: "https://github.com/owner/repo.git",
  config: {
    defaultBranch: "main",
    email: "user@example.com",
    username: "johndoe",
  },
  integration: {
    provider: "github",
    credentialId: "01961a2b-0000-7000-8000-000000000050",
  },
  projects: [{ id: PROJECT.id }],
};

const setupProjectList = () => {
  const handler = projectHandler.list({ data: [PROJECT] });
  mswServer.use(handler);
  handler.resolveRequest();
};

const waitForRepositoryToLoad = async () => {
  await screen.findByRole("button", { name: "Edit" });
};

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then renders repository name as page heading", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // then
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "my-repo",
  );
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then displays repository ID", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText(GIT_REPOSITORY.id)).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then displays repository name in details", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // then
  const nameElements = screen.getAllByText("my-repo");
  expect(nameElements.length).toBeGreaterThanOrEqual(2);
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then displays formatted created at timestamp", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then displays formatted updated at timestamp", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then renders Edit button", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then displays configuration details", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // then
  expect(screen.getByText("main")).toBeVisible();
  expect(screen.getByText("user@example.com")).toBeVisible();
  expect(screen.getByText("johndoe")).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository data, when page loads, then displays integration details", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // then
  expect(screen.getByText("GitHub")).toBeVisible();
  expect(
    screen.getByText("01961a2b-0000-7000-8000-000000000050"),
  ).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository with assigned project, when page loads, then displays assigned project name", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // then
  expect(screen.getByText("Alpha Project")).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository with no projects, when page loads, then displays 'No projects assigned'", async () => {
  // given
  setupProjectList();
  const repoWithoutProjects: GitRepository = {
    ...GIT_REPOSITORY,
    projects: [],
  };
  const getByIdHandler = gitRepositoryHandler.getById({
    data: repoWithoutProjects,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id={repoWithoutProjects.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // then
  expect(screen.getByText("No projects assigned")).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given API returns error, when page loads, then shows 404", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableGitRepositoryDetailsPage id="non-existent-id" />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("404 - Not Found")).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given clipboard is available, when user clicks copy, then copies repository ID to clipboard and shows toast", async () => {
  // given
  const originalClipboard = navigator.clipboard;
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Copy ID" }));

  // then
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(GIT_REPOSITORY.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();

  Object.assign(navigator, { clipboard: originalClipboard });
});

test("EditableGitRepositoryDetailsPage: given repository data is loaded, when user clicks Edit, then switches to edit form", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given repository data is loaded, when user clicks Edit, then edit form is pre-populated with repository data", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await screen.findByRole("button", { name: "Edit" });

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("my-repo");
  expect(screen.getByLabelText("URL")).toHaveValue(
    "https://github.com/owner/repo.git",
  );
  expect(screen.getByLabelText("Default Branch")).toHaveValue("main");
  expect(screen.getByLabelText("Email")).toHaveValue("user@example.com");
  expect(screen.getByLabelText("Username")).toHaveValue("johndoe");
  expect(screen.getByLabelText("Credential ID")).toHaveValue(
    "01961a2b-0000-7000-8000-000000000050",
  );
});

test("EditableGitRepositoryDetailsPage: given edit form is open, when user clicks Cancel, then returns to view mode", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  mswServer.use(getByIdHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Name")).toBeVisible();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given edit form is submitted successfully, when update resolves, then shows success toast and returns to view mode", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  const updateHandler = gitRepositoryHandler.updateById();
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "updated-repo");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  updateHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Git repository updated successfully"),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
});

test("EditableGitRepositoryDetailsPage: given edit form is submitted with server error, when update resolves with error, then shows error toast", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  const updateHandler = gitRepositoryHandler.updateById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  updateHandler.resolveRequest();
  await waitForRepositoryToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(
    await screen.findByText("Failed to update git repository"),
  ).toBeVisible();
});

test("EditableGitRepositoryDetailsPage: given edit form is submitted, when update is in progress, then shows 'Saving...'", async () => {
  // given
  setupProjectList();
  const getByIdHandler = gitRepositoryHandler.getById({ data: GIT_REPOSITORY });
  const updateHandler = gitRepositoryHandler.updateById();
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);
  getByIdHandler.resolveRequest();
  await waitForRepositoryToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  updateHandler.resolveRequest();
});
