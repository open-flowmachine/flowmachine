import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  await userEvent.type(
    screen.getByLabelText("Credential ID"),
    "01961a2b-0000-7000-8000-000000000050",
  );
};

describe("NewGitRepositoryPage", () => {
  beforeEach(() => {
    setupProjectList();
  });

  it("renders the page heading", async () => {
    testRender(<NewGitRepositoryPage />);

    expect(await screen.findByText("New Git Repository")).toBeVisible();
  });

  it("renders form field labels", async () => {
    testRender(<NewGitRepositoryPage />);

    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByLabelText("URL")).toBeVisible();
    expect(screen.getByLabelText("Default Branch")).toBeVisible();
    expect(screen.getByLabelText("Email")).toBeVisible();
    expect(screen.getByLabelText("Username")).toBeVisible();
    expect(screen.getByText("Provider")).toBeVisible();
    expect(screen.getByLabelText("Credential ID")).toBeVisible();
  });

  it("renders Reset and Save buttons", async () => {
    testRender(<NewGitRepositoryPage />);

    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("submits form and shows success toast", async () => {
    const createHandler = gitRepositoryHandler.create();
    mswServer.use(createHandler);

    testRender(<NewGitRepositoryPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    createHandler.resolveRequest();

    expect(
      await screen.findByText("Git Repository created successfully"),
    ).toBeVisible();
  });

  it("redirects to /platform/git-repository on successful creation", async () => {
    const createHandler = gitRepositoryHandler.create();
    mswServer.use(createHandler);

    testRender(<NewGitRepositoryPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    createHandler.resolveRequest();

    await screen.findByText("Git Repository created successfully");

    expect(mockPush).toHaveBeenCalledWith("/platform/git-repository");
  });

  it("shows error toast on creation failure", async () => {
    const createHandler = gitRepositoryHandler.create({
      status: 500,
      code: "error",
      message: "error",
    });
    mswServer.use(createHandler);

    testRender(<NewGitRepositoryPage />);

    createHandler.resolveRequest();

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Failed to create Git Repository"),
    ).toBeVisible();
  });

  it("shows 'Saving...' while submission is in progress", async () => {
    const createHandler = gitRepositoryHandler.create();
    mswServer.use(createHandler);

    testRender(<NewGitRepositoryPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saving...")).toBeVisible();

    createHandler.resolveRequest();
  });

  it("disables form fields while submitting", async () => {
    const createHandler = gitRepositoryHandler.create();
    mswServer.use(createHandler);

    testRender(<NewGitRepositoryPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Saving...");

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("URL")).toBeDisabled();
    expect(screen.getByLabelText("Default Branch")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Username")).toBeDisabled();
    expect(screen.getByLabelText("Credential ID")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

    createHandler.resolveRequest();
  });

  it("resets form when Reset is clicked", async () => {
    testRender(<NewGitRepositoryPage />);

    await userEvent.type(screen.getByLabelText("Name"), "Some Repo");
    expect(screen.getByLabelText("Name")).toHaveValue("Some Repo");

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
});
