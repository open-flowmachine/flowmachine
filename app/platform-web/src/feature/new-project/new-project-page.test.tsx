import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText("Name"), "My New Project");
  await userEvent.type(
    screen.getByLabelText("Domain"),
    "example.atlassian.net",
  );
  await userEvent.type(
    screen.getByLabelText("Credential ID"),
    "01961a2b-0000-7000-8000-000000000050",
  );
  await userEvent.type(screen.getByLabelText("External ID"), "10001");
  await userEvent.type(screen.getByLabelText("External Key"), "PROJ");
  await userEvent.type(screen.getByLabelText("Webhook Secret"), "secret-abc");
};

describe("NewProjectPage", () => {
  it("renders the page heading", async () => {
    testRender(<NewProjectPage />);

    expect(await screen.findByText("New Project")).toBeVisible();
  });

  it("renders form field labels", async () => {
    testRender(<NewProjectPage />);

    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByText("Provider")).toBeVisible();
    expect(screen.getByLabelText("Domain")).toBeVisible();
    expect(screen.getByLabelText("Credential ID")).toBeVisible();
    expect(screen.getByLabelText("External ID")).toBeVisible();
    expect(screen.getByLabelText("External Key")).toBeVisible();
    expect(screen.getByLabelText("Webhook Secret")).toBeVisible();
  });

  it("renders Reset and Save buttons", async () => {
    testRender(<NewProjectPage />);

    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("submits form and shows success toast", async () => {
    const projectCreateHandler = projectHandler.create();
    mswServer.use(projectCreateHandler);

    testRender(<NewProjectPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    projectCreateHandler.resolveRequest();

    expect(
      await screen.findByText("Project created successfully"),
    ).toBeVisible();
  });

  it("redirects to /platform/project on successful creation", async () => {
    const projectCreateHandler = projectHandler.create();
    mswServer.use(projectCreateHandler);

    testRender(<NewProjectPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    projectCreateHandler.resolveRequest();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/platform/project");
    });
  });

  it("shows error toast on creation failure", async () => {
    const projectCreateHandler = projectHandler.create({
      status: 500,
      code: "error",
      message: "error",
    });
    mswServer.use(projectCreateHandler);

    testRender(<NewProjectPage />);

    projectCreateHandler.resolveRequest();

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Failed to create project")).toBeVisible();
  });

  it("shows 'Saving...' while submission is in progress", async () => {
    const projectCreateHandler = projectHandler.create();
    mswServer.use(projectCreateHandler);

    testRender(<NewProjectPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saving...")).toBeVisible();

    projectCreateHandler.resolveRequest();
  });

  it("disables form fields while submitting", async () => {
    const projectCreateHandler = projectHandler.create();
    mswServer.use(projectCreateHandler);

    testRender(<NewProjectPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Saving...");

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Domain")).toBeDisabled();
    expect(screen.getByLabelText("Credential ID")).toBeDisabled();
    expect(screen.getByLabelText("External ID")).toBeDisabled();
    expect(screen.getByLabelText("External Key")).toBeDisabled();
    expect(screen.getByLabelText("Webhook Secret")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

    projectCreateHandler.resolveRequest();
  });

  it("resets form when Reset is clicked", async () => {
    testRender(<NewProjectPage />);

    await userEvent.type(screen.getByLabelText("Name"), "Some Project");
    expect(screen.getByLabelText("Name")).toHaveValue("Some Project");

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
});
