import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("EditableGitRepositoryDetailsPage", () => {
  describe("view mode", () => {
    it("renders repository name as page heading", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "my-repo",
      );
    });

    it("displays repository ID", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText(GIT_REPOSITORY.id)).toBeVisible();
    });

    it("displays repository name in details", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      const nameElements = screen.getAllByText("my-repo");
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it("displays formatted created at timestamp", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
    });

    it("displays formatted updated at timestamp", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
    });

    it("renders Edit button", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("displays configuration details", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      expect(screen.getByText("main")).toBeVisible();
      expect(screen.getByText("user@example.com")).toBeVisible();
      expect(screen.getByText("johndoe")).toBeVisible();
    });

    it("displays integration details", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      expect(screen.getByText("GitHub")).toBeVisible();
      expect(
        screen.getByText("01961a2b-0000-7000-8000-000000000050"),
      ).toBeVisible();
    });

    it("displays assigned project name", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      expect(screen.getByText("Alpha Project")).toBeVisible();
    });

    it("displays 'No projects assigned' when projects list is empty", async () => {
      setupProjectList();
      const repoWithoutProjects: GitRepository = {
        ...GIT_REPOSITORY,
        projects: [],
      };
      const getByIdHandler = gitRepositoryHandler.getById({
        data: repoWithoutProjects,
      });
      mswServer.use(getByIdHandler);

      testRender(
        <EditableGitRepositoryDetailsPage id={repoWithoutProjects.id} />,
      );

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      expect(screen.getByText("No projects assigned")).toBeVisible();
    });
  });

  describe("404 error", () => {
    it("shows 404 when API returns error", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        status: 500,
        code: "error",
        message: "error",
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id="non-existent-id" />);

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

    it("copies repository ID to clipboard and shows toast", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();

      const copyButtons = screen.getAllByRole("button");
      const copyButton = copyButtons.find((btn) =>
        btn.querySelector(".lucide-copy"),
      )!;
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        GIT_REPOSITORY.id,
      );
      expect(await screen.findByText("Copied to clipboard")).toBeVisible();
    });
  });

  describe("edit mode", () => {
    it("clicking Edit switches to edit form", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
    });

    it("edit form is pre-populated with repository data", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await screen.findByRole("button", { name: "Edit" });
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

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

    it("clicking Cancel returns to view mode", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("successful update shows toast and returns to view mode", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      const updateHandler = gitRepositoryHandler.updateById();
      mswServer.use(getByIdHandler, updateHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "updated-repo");

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      updateHandler.resolveRequest();

      expect(
        await screen.findByText("Git repository updated successfully"),
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("failed update shows error toast", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
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

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(
        await screen.findByText("Failed to update git repository"),
      ).toBeVisible();
    });

    it("shows 'Saving...' while update is in progress", async () => {
      setupProjectList();
      const getByIdHandler = gitRepositoryHandler.getById({
        data: GIT_REPOSITORY,
      });
      const updateHandler = gitRepositoryHandler.updateById();
      mswServer.use(getByIdHandler, updateHandler);

      testRender(<EditableGitRepositoryDetailsPage id={GIT_REPOSITORY.id} />);

      getByIdHandler.resolveRequest();

      await waitForRepositoryToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Saving...")).toBeVisible();

      updateHandler.resolveRequest();
    });
  });
});
