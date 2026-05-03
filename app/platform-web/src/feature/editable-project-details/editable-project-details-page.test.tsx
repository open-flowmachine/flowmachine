import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

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

test("EditableProjectDetailsPage: given project data, when page loads, then renders project name as page heading", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();

  // then
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Alpha Project",
  );
});

test("EditableProjectDetailsPage: given project data, when page loads, then displays project ID", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText(PROJECT_WITHOUT_INTEGRATION.id)).toBeVisible();
});

test("EditableProjectDetailsPage: given project data, when page loads, then displays project name in details", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();

  // then
  const nameElements = screen.getAllByText("Alpha Project");
  expect(nameElements.length).toBeGreaterThanOrEqual(2);
});

test("EditableProjectDetailsPage: given project data, when page loads, then displays formatted created at timestamp", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("EditableProjectDetailsPage: given project data, when page loads, then displays formatted updated at timestamp", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
});

test("EditableProjectDetailsPage: given project data, when page loads, then renders Edit button", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();

  // then
  expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableProjectDetailsPage: given project with integration, when page loads, then displays integration details", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITH_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(<EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />);
  projectGetByIdHandler.resolveRequest();
  await screen.findByRole("button", { name: "Edit" });

  // then
  expect(screen.getByText("Jira")).toBeVisible();
  expect(screen.getByText("example.atlassian.net")).toBeVisible();
  expect(
    screen.getByText("01961a2b-0000-7000-8000-000000000050"),
  ).toBeVisible();
  expect(screen.getByText("10001")).toBeVisible();
  expect(screen.getByText("BETA")).toBeVisible();
  expect(screen.getByText("secret-123")).toBeVisible();
});

test("EditableProjectDetailsPage: given project without integration, when page loads, then does not display integration section", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();

  // then
  expect(screen.queryByText("Integration")).toBeNull();
});

test("EditableProjectDetailsPage: given API returns error, when page loads, then shows 404", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(projectGetByIdHandler);

  // when
  testRender(<EditableProjectDetailsPage id="non-existent-id" />);
  projectGetByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("404 - Not Found")).toBeVisible();
});

test("EditableProjectDetailsPage: given clipboard is available, when user clicks copy, then copies project ID to clipboard and shows toast", async () => {
  // given
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText },
  });

  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Copy ID" }));

  // then
  expect(writeText).toHaveBeenCalledWith(PROJECT_WITHOUT_INTEGRATION.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();

  Object.assign(navigator, { clipboard: originalClipboard });
});

test("EditableProjectDetailsPage: given project data is loaded, when user clicks Edit, then switches to edit form", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITHOUT_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  testRender(
    <EditableProjectDetailsPage id={PROJECT_WITHOUT_INTEGRATION.id} />,
  );
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("EditableProjectDetailsPage: given project data is loaded, when user clicks Edit, then edit form is pre-populated with project data", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITH_INTEGRATION,
  });
  mswServer.use(projectGetByIdHandler);

  testRender(<EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />);
  projectGetByIdHandler.resolveRequest();
  await screen.findByRole("button", { name: "Edit" });

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("Beta Project");
  expect(screen.getByLabelText("Domain")).toHaveValue("example.atlassian.net");
  expect(screen.getByLabelText("Credential ID")).toHaveValue(
    "01961a2b-0000-7000-8000-000000000050",
  );
  expect(screen.getByLabelText("External ID")).toHaveValue("10001");
  expect(screen.getByLabelText("External Key")).toHaveValue("BETA");
  expect(screen.getByLabelText("Webhook Secret")).toHaveValue("secret-123");
});

test("EditableProjectDetailsPage: given edit form is open, when user clicks Cancel, then returns to view mode", async () => {
  // given
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

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableProjectDetailsPage: given edit form is submitted successfully, when update resolves, then shows success toast and returns to view mode", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITH_INTEGRATION,
  });
  const updateHandler = projectHandler.updateById();
  mswServer.use(projectGetByIdHandler, updateHandler);

  testRender(<EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />);
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "Updated Project");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  updateHandler.resolveRequest();

  // then
  expect(await screen.findByText("Project updated successfully")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
});

test("EditableProjectDetailsPage: given edit form is submitted with server error, when update resolves with error, then shows error toast", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITH_INTEGRATION,
  });
  const projectUpdateByIdHandler = projectHandler.updateById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(projectGetByIdHandler, projectUpdateByIdHandler);

  testRender(<EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />);
  projectGetByIdHandler.resolveRequest();
  projectUpdateByIdHandler.resolveRequest();
  await waitForProjectToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Failed to update project")).toBeVisible();
});

test("EditableProjectDetailsPage: given edit form is submitted, when update is in progress, then shows 'Saving...'", async () => {
  // given
  const projectGetByIdHandler = projectHandler.getById({
    data: PROJECT_WITH_INTEGRATION,
  });
  const updateHandler = projectHandler.updateById();
  mswServer.use(projectGetByIdHandler, updateHandler);

  testRender(<EditableProjectDetailsPage id={PROJECT_WITH_INTEGRATION.id} />);
  projectGetByIdHandler.resolveRequest();
  await waitForProjectToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  updateHandler.resolveRequest();
});
