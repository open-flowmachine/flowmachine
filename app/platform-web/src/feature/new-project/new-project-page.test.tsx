import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { NewProjectPage } from "./new-project-page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/project/new",
}));

const projectHandler = makeProjectMswHandler();

const CREDENTIAL_ID = "01961a2b-0000-7000-8000-000000000050";

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText("Name"), "My New Project");
  await userEvent.type(
    screen.getByLabelText("Domain"),
    "example.atlassian.net",
  );
  await userEvent.type(screen.getByLabelText("Credential ID"), CREDENTIAL_ID);
  await userEvent.type(screen.getByLabelText("External ID"), "10001");
  await userEvent.type(screen.getByLabelText("External Key"), "PROJ");
  await userEvent.type(screen.getByLabelText("Webhook Secret"), "secret-abc");
};

test("NewProjectPage: given the page loads, when rendered, then the page heading is visible", async () => {
  // given
  testRender(<NewProjectPage />);

  // then
  expect(await screen.findByText("New Project")).toBeVisible();
});

test("NewProjectPage: given the page loads, when rendered, then all form field labels are visible", async () => {
  // given
  testRender(<NewProjectPage />);

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByText("Provider")).toBeVisible();
  expect(screen.getByLabelText("Domain")).toBeVisible();
  expect(screen.getByLabelText("Credential ID")).toBeVisible();
  expect(screen.getByLabelText("External ID")).toBeVisible();
  expect(screen.getByLabelText("External Key")).toBeVisible();
  expect(screen.getByLabelText("Webhook Secret")).toBeVisible();
});

test("NewProjectPage: given the page loads, when rendered, then Reset and Save buttons are visible", async () => {
  // given
  testRender(<NewProjectPage />);

  // then
  expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("NewProjectPage: given a valid form, when Save is clicked and the request succeeds, then a success toast is shown", async () => {
  // given
  const projectCreateHandler = projectHandler.create();
  mswServer.use(projectCreateHandler);

  testRender(<NewProjectPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  projectCreateHandler.resolveRequest();

  // then
  expect(await screen.findByText("Project created successfully")).toBeVisible();
});

test("NewProjectPage: given a valid form, when Save is clicked and the request succeeds, then the router redirects to /platform/project", async () => {
  // given
  const projectCreateHandler = projectHandler.create();
  mswServer.use(projectCreateHandler);

  testRender(<NewProjectPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  projectCreateHandler.resolveRequest();

  // then
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/platform/project");
  });
});

test("NewProjectPage: given a valid form, when Save is clicked and the request fails, then an error toast is shown", async () => {
  // given
  const projectCreateHandler = projectHandler.create({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(projectCreateHandler);

  testRender(<NewProjectPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  projectCreateHandler.resolveRequest();

  // then
  expect(await screen.findByText("Failed to create project")).toBeVisible();
});

test("NewProjectPage: given a valid form, when Save is clicked and the request is in progress, then a Saving... label is visible", async () => {
  // given
  const projectCreateHandler = projectHandler.create();
  mswServer.use(projectCreateHandler);

  testRender(<NewProjectPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  projectCreateHandler.resolveRequest();
});

test("NewProjectPage: given a valid form, when Save is clicked and the request is in progress, then form fields are disabled", async () => {
  // given
  const projectCreateHandler = projectHandler.create();
  mswServer.use(projectCreateHandler);

  testRender(<NewProjectPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  await screen.findByText("Saving...");

  // then
  expect(screen.getByLabelText("Name")).toBeDisabled();
  expect(screen.getByLabelText("Domain")).toBeDisabled();
  expect(screen.getByLabelText("Credential ID")).toBeDisabled();
  expect(screen.getByLabelText("External ID")).toBeDisabled();
  expect(screen.getByLabelText("External Key")).toBeDisabled();
  expect(screen.getByLabelText("Webhook Secret")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

  projectCreateHandler.resolveRequest();
});

test("NewProjectPage: given a filled form, when Reset is clicked, then the form is cleared", async () => {
  // given
  testRender(<NewProjectPage />);

  await userEvent.type(screen.getByLabelText("Name"), "Some Project");
  expect(screen.getByLabelText("Name")).toHaveValue("Some Project");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("");
});
