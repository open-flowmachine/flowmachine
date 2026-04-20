import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { makeAiAgentMswHandler } from "@/test/msw/msw-ai-agent-handler";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { NewAiAgentPage } from "./new-ai-agent-page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/ai-agent/new",
}));

const aiAgentHandler = makeAiAgentMswHandler();
const projectHandler = makeProjectMswHandler();

const setupProjectList = () => {
  const listHandler = projectHandler.list({ data: [] });
  mswServer.use(listHandler);
  listHandler.resolveRequest();
};

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText("Name"), "My New Agent");
};

test("NewAiAgentPage: given page is rendered, when it mounts, then renders the page heading", async () => {
  // given
  setupProjectList();

  // when
  testRender(<NewAiAgentPage />);

  // then
  expect(await screen.findByText("New AI Agent")).toBeVisible();
});

test("NewAiAgentPage: given page is rendered, when it mounts, then renders form field labels", async () => {
  // given
  setupProjectList();

  // when
  testRender(<NewAiAgentPage />);

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByText("Model")).toBeVisible();
  expect(screen.getByText("Assigned projects")).toBeVisible();
});

test("NewAiAgentPage: given page is rendered, when it mounts, then renders Reset and Save buttons", async () => {
  // given
  setupProjectList();

  // when
  testRender(<NewAiAgentPage />);

  // then
  expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("NewAiAgentPage: given form is filled out, when user submits, then shows success toast", async () => {
  // given
  setupProjectList();
  const createHandler = aiAgentHandler.create();
  mswServer.use(createHandler);

  testRender(<NewAiAgentPage />);
  await fillForm();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  createHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("AI Agent created successfully"),
  ).toBeVisible();
});

test("NewAiAgentPage: given form is filled out and submitted successfully, when creation resolves, then redirects to /platform/ai-agent", async () => {
  // given
  setupProjectList();
  const createHandler = aiAgentHandler.create();
  mswServer.use(createHandler);

  testRender(<NewAiAgentPage />);
  await fillForm();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  createHandler.resolveRequest();

  // then
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/platform/ai-agent");
  });
});

test("NewAiAgentPage: given server returns error, when user submits form, then shows error toast", async () => {
  // given
  setupProjectList();
  const createHandler = aiAgentHandler.create({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(createHandler);

  testRender(<NewAiAgentPage />);
  createHandler.resolveRequest();
  await fillForm();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Failed to create AI Agent")).toBeVisible();
});

test("NewAiAgentPage: given form is submitted, when creation is in progress, then shows 'Saving...'", async () => {
  // given
  setupProjectList();
  const createHandler = aiAgentHandler.create();
  mswServer.use(createHandler);

  testRender(<NewAiAgentPage />);
  await fillForm();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  createHandler.resolveRequest();
});

test("NewAiAgentPage: given form is submitted, when creation is in progress, then disables form fields", async () => {
  // given
  setupProjectList();
  const createHandler = aiAgentHandler.create();
  mswServer.use(createHandler);

  testRender(<NewAiAgentPage />);
  await fillForm();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Saving...");

  // then
  expect(screen.getByLabelText("Name")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

  createHandler.resolveRequest();
});

test("NewAiAgentPage: given Name field has been filled, when user clicks Reset, then clears the form", async () => {
  // given
  setupProjectList();
  testRender(<NewAiAgentPage />);
  await userEvent.type(screen.getByLabelText("Name"), "Some Agent");
  expect(screen.getByLabelText("Name")).toHaveValue("Some Agent");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("");
});
