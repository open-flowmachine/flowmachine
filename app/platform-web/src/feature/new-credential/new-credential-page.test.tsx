import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeCredentialMswHandler } from "@/test/msw/msw-credential-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";
import { NewCredentialPage } from "./new-credential-page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/credential/new",
}));

const credentialHandler = makeCredentialMswHandler();

const selectFutureDate = async () => {
  await userEvent.click(screen.getByText("Pick a date"));
  const dayButton = await screen.findByRole("button", { name: /28th/ });
  await userEvent.click(dayButton);
};

const fillApiKeyForm = async () => {
  await selectFutureDate();
  await userEvent.type(screen.getByLabelText("Name"), "Production API Token");
  await userEvent.type(screen.getByLabelText("API Key"), "sk-1234567890abcdef");
};

describe("NewCredentialPage", () => {
  it("renders the page heading", async () => {
    testRender(<NewCredentialPage />);

    expect(await screen.findByText("New Credential")).toBeVisible();
  });

  it("renders form field labels for apiKey type", async () => {
    testRender(<NewCredentialPage />);

    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.getByText("Type")).toBeVisible();
    expect(screen.getByLabelText("API Key")).toBeVisible();
  });

  it("renders Reset and Save buttons", async () => {
    testRender(<NewCredentialPage />);

    expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("shows Username and Password fields when type is basic", async () => {
    testRender(<NewCredentialPage />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "Basic" }));

    expect(screen.getByLabelText("Username")).toBeVisible();
    expect(screen.getByLabelText("Password")).toBeVisible();
    expect(screen.queryByLabelText("API Key")).toBeNull();
  });

  it("submits form and shows success toast", async () => {
    const createHandler = credentialHandler.create();
    mswServer.use(createHandler);

    testRender(<NewCredentialPage />);

    await fillApiKeyForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    createHandler.resolveRequest();

    expect(
      await screen.findByText("Credential created successfully"),
    ).toBeVisible();
  });

  it("redirects to /platform/credential on successful creation", async () => {
    const createHandler = credentialHandler.create();
    mswServer.use(createHandler);

    testRender(<NewCredentialPage />);

    await fillApiKeyForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    createHandler.resolveRequest();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/platform/credential");
    });
  });

  it("shows error toast on creation failure", async () => {
    const createHandler = credentialHandler.create({
      status: 500,
      code: "error",
      message: "error",
    });
    mswServer.use(createHandler);

    testRender(<NewCredentialPage />);

    createHandler.resolveRequest();

    await fillApiKeyForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Failed to create credential"),
    ).toBeVisible();
  });

  it("shows 'Saving...' while submission is in progress", async () => {
    const createHandler = credentialHandler.create();
    mswServer.use(createHandler);

    testRender(<NewCredentialPage />);

    await fillApiKeyForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saving...")).toBeVisible();

    createHandler.resolveRequest();
  });

  it("disables form fields while submitting", async () => {
    const createHandler = credentialHandler.create();
    mswServer.use(createHandler);

    testRender(<NewCredentialPage />);

    await fillApiKeyForm();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Saving...");

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("API Key")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

    createHandler.resolveRequest();
  });

  it("resets form when Reset is clicked", async () => {
    testRender(<NewCredentialPage />);

    await userEvent.type(screen.getByLabelText("Name"), "Some Credential");
    expect(screen.getByLabelText("Name")).toHaveValue("Some Credential");

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });
});
