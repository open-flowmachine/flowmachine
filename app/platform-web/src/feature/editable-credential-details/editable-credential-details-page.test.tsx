import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import type { Credential } from "@/module/credential/credential-type";

import { makeCredentialMswHandler } from "@/test/msw/msw-credential-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import { EditableCredentialDetailsPage } from "./editable-credential-details-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () =>
    "/platform/credential/01961a2b-0000-7000-8000-000000000001",
}));

const credentialHandler = makeCredentialMswHandler();

const CREDENTIAL_API_KEY: Credential = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-20T14:00:00.000Z",
  type: "apiKey",
  name: "Production API Token",
  apiKey: "sk-1234567890abcdef",
  expiredAt: "2027-01-15T10:30:00.000Z",
  tenant: { id: "01961a2b-0000-7000-8000-000000000100", type: "organization" },
};

const CREDENTIAL_BASIC: Credential = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-02-25T16:30:00.000Z",
  type: "basic",
  name: "Staging Basic Auth",
  username: "admin-user",
  password: "secret-password",
  expiredAt: "2027-02-20T14:00:00.000Z",
  tenant: { id: "01961a2b-0000-7000-8000-000000000100", type: "organization" },
};

const waitForCredentialToLoad = async () => {
  await screen.findByRole("button", { name: "Edit" });
};

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then renders credential name as page heading", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // then
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Production API Token",
  );
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays credential ID", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText(CREDENTIAL_API_KEY.id)).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays credential name in details", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // then
  const nameElements = screen.getAllByText("Production API Token");
  expect(nameElements.length).toBeGreaterThanOrEqual(2);
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays type badge", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // then
  const apiKeyElements = screen.getAllByText("API Key");
  expect(apiKeyElements.length).toBeGreaterThanOrEqual(2);
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays masked API key value", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // then
  // sk-1234567890abcdef (18 chars) → sk-1 + masked middle + cdef
  expect(screen.getByText(/sk-1.*cdef/)).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays formatted created at timestamp", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays formatted updated at timestamp", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then displays formatted expired at timestamp", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2027, 10:30 AM")).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then renders Edit button", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableCredentialDetailsPage: given a basic credential, when the page loads, then displays Password field", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_BASIC,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_BASIC.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // then
  expect(screen.getByText("Password")).toBeVisible();
  expect(screen.getByText("••••••••")).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the page loads, then does not display Password field", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // then
  expect(screen.queryByText("Password")).toBeNull();
});

test("EditableCredentialDetailsPage: given a non-existent credential ID, when the API returns an error, then shows 404 Not Found", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(getByIdHandler);

  // when
  testRender(<EditableCredentialDetailsPage id="non-existent-id" />);
  getByIdHandler.resolveRequest();

  // then
  expect(await screen.findByText("404 - Not Found")).toBeVisible();
});

test("EditableCredentialDetailsPage: given clipboard is available and the page has loaded, when the copy button is clicked, then copies credential ID to clipboard and shows toast", async () => {
  // given
  const originalClipboard = navigator.clipboard;
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText },
  });

  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Copy ID" }));

  // then
  expect(writeText).toHaveBeenCalledWith(CREDENTIAL_API_KEY.id);
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();

  Object.assign(navigator, { clipboard: originalClipboard });
});

test("EditableCredentialDetailsPage: given the page has loaded, when Edit is clicked, then switches to edit form", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
});

test("EditableCredentialDetailsPage: given an API key credential, when the edit form is opened, then is pre-populated with apiKey credential data", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await screen.findByRole("button", { name: "Edit" });

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("Production API Token");
  expect(screen.getByLabelText("API Key")).toHaveValue(
    "sk-1234567890abcdef",
  );
});

test("EditableCredentialDetailsPage: given a basic credential, when the edit form is opened, then is pre-populated with basic credential data", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_BASIC,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_BASIC.id} />);
  getByIdHandler.resolveRequest();
  await screen.findByRole("button", { name: "Edit" });

  // when
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));

  // then
  expect(screen.getByLabelText("Name")).toHaveValue("Staging Basic Auth");
  expect(screen.getByLabelText("Username")).toHaveValue("admin-user");
  expect(screen.getByLabelText("Password")).toHaveValue("secret-password");
});

test("EditableCredentialDetailsPage: given the edit form is open, when Cancel is clicked, then returns to view mode", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  mswServer.use(getByIdHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Name")).toBeVisible();

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
});

test("EditableCredentialDetailsPage: given a valid update, when Save is clicked and succeeds, then shows toast and returns to view mode", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  const updateHandler = credentialHandler.updateById();
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "Updated Token");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  updateHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Credential updated successfully"),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
});

test("EditableCredentialDetailsPage: given an update that fails, when Save is clicked, then shows error toast", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  const updateHandler = credentialHandler.updateById({
    status: 500,
    code: "error",
    message: "error",
  });
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "Updated Token");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  updateHandler.resolveRequest();

  // then
  expect(
    await screen.findByText("Failed to update credential"),
  ).toBeVisible();
});

test("EditableCredentialDetailsPage: given Save is clicked, when update is in progress, then shows Saving...", async () => {
  // given
  const getByIdHandler = credentialHandler.getById({
    data: CREDENTIAL_API_KEY,
  });
  const updateHandler = credentialHandler.updateById();
  mswServer.use(getByIdHandler, updateHandler);

  testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);
  getByIdHandler.resolveRequest();
  await waitForCredentialToLoad();
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  await userEvent.clear(screen.getByLabelText("Name"));
  await userEvent.type(screen.getByLabelText("Name"), "Updated Token");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  // then
  expect(await screen.findByText("Saving...")).toBeVisible();

  updateHandler.resolveRequest();
});
