import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

describe("NewAiAgentPage", () => {
  it("renders the page heading", async () => {
    setupProjectList();
    testRender(<NewAiAgentPage />);

    expect(await screen.findByText("New AI Agent")).toBeVisible();
  });

  it("renders form field labels", async () => {
    setupProjectList();
    testRender(<NewAiAgentPage />);

    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByText("Model")).toBeVisible();
    expect(screen.getByText("Assigned projects")).toBeVisible();
  });

  it("renders Reset and Save buttons", async () => {
    setupProjectList();
    testRender(<NewAiAgentPage />);

    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("submits form and shows success toast", async () => {
    setupProjectList();
    const createHandler = aiAgentHandler.create();
    mswServer.use(createHandler);

    testRender(<NewAiAgentPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    createHandler.resolveRequest();

    expect(
      await screen.findByText("AI Agent created successfully"),
    ).toBeVisible();
  });

  it("redirects to /platform/ai-agent on successful creation", async () => {
    setupProjectList();
    const createHandler = aiAgentHandler.create();
    mswServer.use(createHandler);

    testRender(<NewAiAgentPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    createHandler.resolveRequest();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/platform/ai-agent");
    });
  });

  it("shows error toast on creation failure", async () => {
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
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Failed to create AI Agent"),
    ).toBeVisible();
  });

  it("shows 'Saving...' while submission is in progress", async () => {
    setupProjectList();
    const createHandler = aiAgentHandler.create();
    mswServer.use(createHandler);

    testRender(<NewAiAgentPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saving...")).toBeVisible();

    createHandler.resolveRequest();
  });

  it("disables form fields while submitting", async () => {
    setupProjectList();
    const createHandler = aiAgentHandler.create();
    mswServer.use(createHandler);

    testRender(<NewAiAgentPage />);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Saving...");

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

    createHandler.resolveRequest();
  });

  it("resets form when Reset is clicked", async () => {
    setupProjectList();
    testRender(<NewAiAgentPage />);

    await userEvent.type(screen.getByLabelText("Name"), "Some Agent");
    expect(screen.getByLabelText("Name")).toHaveValue("Some Agent");

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
});
