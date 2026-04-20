import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

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

const fillApiKeyForm = async () => {
  await userEvent.type(screen.getByLabelText("Name"), "Production API Token");
  await userEvent.type(screen.getByLabelText("API Key"), "sk-1234567890abcdef");
};

test("NewCredentialPage: given the page loads, when rendered, then the page heading is visible", async () => {
  // given
  testRender(<NewCredentialPage />);

  // then
  expect(await screen.findByText("New Credential")).toBeVisible();
});

test("NewCredentialPage: given the default apiKey type, when rendered, then Name, Type, and API Key fields are visible", async () => {
  // given
  testRender(<NewCredentialPage />);

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByText("Type")).toBeVisible();
  expect(screen.getByLabelText("API Key")).toBeVisible();
});

test("NewCredentialPage: given the page loads, when rendered, then Reset and Save buttons are visible", async () => {
  // given
  testRender(<NewCredentialPage />);

  // then
  expect(screen.getByRole("button", { name: "Reset" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("NewCredentialPage: given the basic type is selected, when the type combobox is changed, then Username and Password fields are shown and API Key is hidden", async () => {
  // given
  testRender(<NewCredentialPage />);

  // when
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.click(screen.getByRole("option", { name: "Basic" }));

  // then
  expect(screen.getByLabelText("Username")).toBeVisible();
  expect(screen.getByLabelText("Password")).toBeVisible();
  expect(screen.queryByLabelText("API Key")).toBeNull();
});

test("NewCredentialPage: given a valid form, when Save is clicked and the request succeeds, then a success toast is shown", async () => {
  // given
  const createHandler = credentialHandler.create();
  mswServer.use(createHandler);

  testRender(<NewCredentialPage />);

  // when
  await fillApiKeyForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  createHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Credential created successfully"),
  ).toBeVisible();
});

test("NewCredentialPage: given a valid form, when Save is clicked and the request succeeds, then the router redirects to /platform/credential", async () => {
  // given
  const createHandler = credentialHandler.create();
  mswServer.use(createHandler);

  testRender(<NewCredentialPage />);

  // when
  await fillApiKeyForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  createHandler.resolveRequest();

  // then
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/platform/credential");
  });
});

test("NewCredentialPage: given a valid form, when Save is clicked and the request fails, then an error toast is shown", async () => {
  // given
  const createHandler = credentialHandler.create({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(createHandler);

  testRender(<NewCredentialPage />);

  // when
  await fillApiKeyForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  createHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Failed to create credential"),
  ).toBeVisible();
});

test("NewCredentialPage: given a valid form, when Save is clicked and the request is in progress, then a Saving... label is visible", async () => {
  // given
  const createHandler = credentialHandler.create();
  mswServer.use(createHandler);

  testRender(<NewCredentialPage />);

  // when
  await fillApiKeyForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  createHandler.resolveRequest();
});

test("NewCredentialPage: given a valid form, when Save is clicked and the request is in progress, then form fields are disabled", async () => {
  // given
  const createHandler = credentialHandler.create();
  mswServer.use(createHandler);

  testRender(<NewCredentialPage />);

  // when
  await fillApiKeyForm();
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  await screen.findByText("Saving...");

  // then
  expect(screen.getByLabelText("Name")).toBeDisabled();
  expect(screen.getByLabelText("API Key")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Reset/ })).toBeDisabled();

  createHandler.resolveRequest();
});

test("NewCredentialPage: given a filled form, when Reset is clicked, then the form is cleared", async () => {
  // given
  testRender(<NewCredentialPage />);

  await userEvent.type(screen.getByLabelText("Name"), "Some Credential");
  expect(screen.getByLabelText("Name")).toHaveValue("Some Credential");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Reset" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("");
});
