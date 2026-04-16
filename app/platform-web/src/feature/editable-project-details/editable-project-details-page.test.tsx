import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "@/module/project/project-type";

import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { EditableProjectDetailsPage } from "./editable-project-details-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/project/01961a2b-0000-7000-8000-000000000001",
}));

const projectHandler = makeProjectMswHandler();

const PROJECT_WITHOUT_INTEGRATION: Project = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-20T14:00:00.000Z",
  name: "Alpha Project",
};

const PROJECT_WITH_INTEGRATION: Project = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-25T16:30:00.000Z",
  name: "Beta Project",
  integration: {
    domain: "example.atlassian.net",
    externalId: "10001",
    externalKey: "BETA",
    provider: "jira",
    webhookSecret: "secret-123",
    credentialId: "01961a2b-0000-7000-8000-000000000050",
  },
};

const waitForProjectToLoad = async () => {
  await screen.findByRole("button", { name: "Edit" });
};

describe("EditableProjectDetailsPage", () => {
  describe("view mode", () => {
    it("renders project name as page heading", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Alpha Project",
      );
    });

    it("displays project ID", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      expect(
        await screen.findByText(PROJECT_WITHOUT_INTEGRATION.id),
      ).toBeVisible();
    });

    it("displays project name in details", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();

      const nameElements = screen.getAllByText("Alpha Project");
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it("displays formatted created at timestamp", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
    });

    it("displays formatted updated at timestamp", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
    });

    it("renders Edit button", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("displays integration details when present", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITH_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await screen.findByRole("button", { name: "Edit" });

      expect(screen.getByText("Jira")).toBeVisible();
      expect(screen.getByText("example.atlassian.net")).toBeVisible();
      expect(
        screen.getByText("01961a2b-0000-7000-8000-000000000050"),
      ).toBeVisible();
      expect(screen.getByText("10001")).toBeVisible();
      expect(screen.getByText("BETA")).toBeVisible();
      expect(screen.getByText("secret-123")).toBeVisible();
    });

    it("does not display integration section when absent", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();

      expect(screen.queryByText("Integration")).toBeNull();
    });
  });

  describe("404 error", () => {
    it("shows 404 when API returns error", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        status: 500,
        code: "error",
        message: "error",
      });
      mswServer.use(projectGetByIdHandler);

      testRender(<EditableProjectDetailsPage id="non-existent-id" />);

      projectGetByIdHandler.resolveRequest();

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

    it("copies project ID to clipboard and shows toast", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();

      const copyButtons = screen.getAllByRole("button");
      const copyButton = copyButtons.find((btn) =>
        btn.querySelector(".lucide-copy"),
      )!;
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        PROJECT_WITHOUT_INTEGRATION.id,
      );
      expect(await screen.findByText("Copied to clipboard")).toBeVisible();
    });
  });

  describe("edit mode", () => {
    it("clicking Edit switches to edit form", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
    });

    it("edit form is pre-populated with project data", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITH_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await screen.findByRole("button", { name: "Edit" });
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toHaveValue("Beta Project");
      expect(screen.getByLabelText("Domain")).toHaveValue(
        "example.atlassian.net",
      );
      expect(screen.getByLabelText("Credential ID")).toHaveValue(
        "01961a2b-0000-7000-8000-000000000050",
      );
      expect(screen.getByLabelText("External ID")).toHaveValue("10001");
      expect(screen.getByLabelText("External Key")).toHaveValue("BETA");
      expect(screen.getByLabelText("Webhook Secret")).toHaveValue("secret-123");
    });

    it("clicking Cancel returns to view mode", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITHOUT_INTEGRATION,
      });
      mswServer.use(projectGetByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("successful update shows toast and returns to view mode", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITH_INTEGRATION,
      });
      const updateHandler = projectHandler.updateById();
      mswServer.use(projectGetByIdHandler, updateHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "Updated Project");

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      updateHandler.resolveRequest();

      expect(
        await screen.findByText("Project updated successfully"),
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("failed update shows error toast", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITH_INTEGRATION,
      });
      const projectUpdateByIdHandler = projectHandler.updateById({
        status: 500,
        code: "error",
        message: "error",
      });
      mswServer.use(projectGetByIdHandler, projectUpdateByIdHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();
      projectUpdateByIdHandler.resolveRequest();

      await waitForProjectToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Failed to update project")).toBeVisible();
    });

    it("shows 'Saving...' while update is in progress", async () => {
      const projectGetByIdHandler = projectHandler.getById({
        data: PROJECT_WITH_INTEGRATION,
      });
      const updateHandler = projectHandler.updateById();
      mswServer.use(projectGetByIdHandler, updateHandler);

      testRender(
        <EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />,
      );

      projectGetByIdHandler.resolveRequest();

      await waitForProjectToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Saving...")).toBeVisible();

      updateHandler.resolveRequest();
    });
  });
});
