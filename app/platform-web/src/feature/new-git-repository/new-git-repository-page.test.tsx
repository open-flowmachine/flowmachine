import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { makeGitRepositoryMswHandler } from "@/test/msw/msw-git-repository-handler";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { NewGitRepositoryPage } from "./new-git-repository-page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/git-repository/new",
}));

const gitRepositoryHandler = makeGitRepositoryMswHandler();
const projectHandler = makeProjectMswHandler();

const CREDENTIAL_ID = "01961a2b-0000-7000-8000-000000000050";

const setupProjectList = () => {
  const handler = projectHandler.list({ data: [] });
  mswServer.use(handler);
  handler.resolveRequest();
};

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText("Name"), "my-repo");
  await userEvent.type(
    screen.getByLabelText("URL"),
    "https://github.com/owner/repo.git",
  );
  await userEvent.clear(screen.getByLabelText("Default Branch"));
  await userEvent.type(screen.getByLabelText("Default Branch"), "main");
  await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
  await userEvent.type(screen.getByLabelText("Username"), "johndoe");
  await userEvent.type(screen.getByLabelText("Credential ID"), CREDENTIAL_ID);
};

test("NewGitRepositoryPage: given the page loads, when rendered, then the page heading is visible", async () => {
  // given
  setupProjectList();
  testRender(<NewGitRepositoryPage />);

  // then
  expect(await screen.findByText("New Git Repository")).toBeVisible();
});

test("NewGitRepositoryPage: given the page loads, when rendered, then all form field labels are visible", async () => {
  // given
  setupProjectList();
  testRender(<NewGitRepositoryPage />);

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByLabelText("URL")).toBeVisible();
  expect(screen.getByLabelText("Default Branch")).toBeVisible();
  expect(screen.getByLabelText("Email")).toBeVisible();
  expect(screen.getByLabelText("Username")).toBeVisible();
  expect(screen.getByText("Provider")).toBeVisible();
  expect(screen.getByLabelText("Credential ID")).toBeVisible();
});

test("NewGitRepositoryPage: given the page loads, when rendered, then Reset and Save buttons are visible", async () => {
  // given
  setupProjectList();
  testRender(<NewGitRepositoryPage />);

  // then
  expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("NewGitRepositoryPage: given a valid form, when Save is clicked and the request succeeds, then a success toast is shown", async () => {
  // given
  setupProjectList();
  const createHandler = gitRepositoryHandler.create();
  mswServer.use(createHandler);

  testRender(<NewGitRepositoryPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  createHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Git Repository created successfully"),
  ).toBeVisible();
});

test("NewGitRepositoryPage: given a valid form, when Save is clicked and the request succeeds, then the router redirects to /platform/git-repository", async () => {
  // given
  setupProjectList();
  const createHandler = gitRepositoryHandler.create();
  mswServer.use(createHandler);

  testRender(<NewGitRepositoryPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  createHandler.resolveRequest();

  await screen.findByText("Git Repository created successfully");

  // then
  expect(mockPush).toHaveBeenCalledWith("/platform/git-repository");
});

test("NewGitRepositoryPage: given a valid form, when Save is clicked and the request fails, then an error toast is shown", async () => {
  // given
  setupProjectList();
  const createHandler = gitRepositoryHandler.create({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(createHandler);

  testRender(<NewGitRepositoryPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  createHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Failed to create Git Repository"),
  ).toBeVisible();
});

test("NewGitRepositoryPage: given a valid form, when Save is clicked and the request is in progress, then a Saving... label is visible", async () => {
  // given
  setupProjectList();
  const createHandler = gitRepositoryHandler.create();
  mswServer.use(createHandler);

  testRender(<NewGitRepositoryPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  createHandler.resolveRequest();
});

test("NewGitRepositoryPage: given a valid form, when Save is clicked and the request is in progress, then form fields are disabled", async () => {
  // given
  setupProjectList();
  const createHandler = gitRepositoryHandler.create();
  mswServer.use(createHandler);

  testRender(<NewGitRepositoryPage />);

  // when
  await fillForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  await screen.findByText("Saving...");

  // then
  expect(screen.getByLabelText("Name")).toBeDisabled();
  expect(screen.getByLabelText("URL")).toBeDisabled();
  expect(screen.getByLabelText("Default Branch")).toBeDisabled();
  expect(screen.getByLabelText("Email")).toBeDisabled();
  expect(screen.getByLabelText("Username")).toBeDisabled();
  expect(screen.getByLabelText("Credential ID")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

  createHandler.resolveRequest();
});

test("NewGitRepositoryPage: given a filled form, when Reset is clicked, then the form is cleared", async () => {
  // given
  setupProjectList();
  testRender(<NewGitRepositoryPage />);

  await userEvent.type(screen.getByLabelText("Name"), "Some Repo");
  expect(screen.getByLabelText("Name")).toHaveValue("Some Repo");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("");
});
