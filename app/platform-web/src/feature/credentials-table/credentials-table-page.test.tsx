import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import type { Credential } from "@/module/credential/credential-type";

import { makeCredentialMswHandler } from "@/test/msw/msw-credential-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";

import CredentialsTablePage from "./credentials-table-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/credential",
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
};

const originalClipboard = navigator.clipboard;

afterEach(() => {
  Object.assign(navigator, { clipboard: originalClipboard });
});

const openActionsMenu = async () => {
  const menuButton = await screen.findByRole("button", {
    name: "Open menu",
  });
  await userEvent.click(menuButton);
  await screen.findByRole("menu");
};

test("CredentialsTablePage: given a list of credentials, when the page loads, then it renders the credentials from the API", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY, CREDENTIAL_BASIC],
  });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Production API Token")).toBeVisible();
  expect(screen.getByText("Staging Basic Auth")).toBeVisible();
});

test("CredentialsTablePage: given the page loads, when the list resolves, then it renders the page heading", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Credential")).toBeVisible();
});

test("CredentialsTablePage: given the page loads, when the list resolves, then it renders the New Credential button", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("New Credential")).toBeVisible();
});

test("CredentialsTablePage: given an empty credential list, when the list resolves, then it shows 'No results.'", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("No results.")).toBeVisible();
});

test("CredentialsTablePage: given a list with one credential, when the list resolves, then it renders column headers", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [CREDENTIAL_API_KEY] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");

  // then
  expect(screen.getByText("Name")).toBeVisible();
  expect(screen.getByText("Type")).toBeVisible();
  expect(screen.getByText("Key Info")).toBeVisible();
  expect(screen.getByText("Expired At")).toBeVisible();
  expect(screen.getByText("Created")).toBeVisible();
});

test("CredentialsTablePage: given a credential with a createdAt timestamp, when the list resolves, then it renders the formatted created date", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [CREDENTIAL_API_KEY] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
});

test("CredentialsTablePage: given a credential in the list, when the list resolves, then it renders the credential name as a link to the detail page", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [CREDENTIAL_API_KEY] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  const link = await screen.findByRole("link", {
    name: "Production API Token",
  });
  expect(link).toHaveAttribute(
    "href",
    `/platform/credential/${CREDENTIAL_API_KEY.id}`,
  );
});

test("CredentialsTablePage: given the page loads, when the list resolves, then the New Credential button links to /platform/credential/new", async () => {
  // given
  const listHandler = credentialHandler.list({ data: [] });
  mswServer.use(listHandler);

  // when
  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();

  // then
  const button = await screen.findByRole("button", {
    name: /New Credential/i,
  });
  expect(button).toHaveAttribute("href", "/platform/credential/new");
});

test("CredentialsTablePage: given a credential in the list, when the actions menu is opened, then it shows all menu items", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  mswServer.use(listHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");

  // when
  await openActionsMenu();

  // then
  expect(screen.getByText("Copy")).toBeVisible();
  expect(screen.getByText("Edit")).toBeVisible();
  expect(screen.getByText("Delete")).toBeVisible();
});

test("CredentialsTablePage: given the clipboard is stubbed and the actions menu is open, when Copy is clicked, then it copies the credential ID to clipboard and shows a success toast", async () => {
  // given
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  mswServer.use(listHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Copy"));

  // then
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    CREDENTIAL_API_KEY.id,
  );
  expect(await screen.findByText("Copied to clipboard")).toBeVisible();
});

test("CredentialsTablePage: given a credential row, when the Edit menu item renders, then its href points to the edit page", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  mswServer.use(listHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();

  // when
  const editLink = screen.getByRole("menuitem", { name: /Edit/ });

  // then
  expect(editLink).toHaveAttribute(
    "href",
    `/platform/credential/${CREDENTIAL_API_KEY.id}`,
  );
});

test("CredentialsTablePage: given a credential in the list and the actions menu is open, when Delete is clicked, then it opens the confirmation dialog", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  mswServer.use(listHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));

  // then
  expect(await screen.findByText("Delete credential")).toBeVisible();
});

test("CredentialsTablePage: given the delete dialog is open, when it appears, then it shows the description text", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  mswServer.use(listHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();

  // when
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete credential");

  // then
  expect(screen.getByText(/Are you sure you want to delete/)).toBeVisible();
});

test("CredentialsTablePage: given the delete dialog is open, when deletion is confirmed, then it calls the API and closes the dialog", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  const deleteHandler = credentialHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete credential");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  deleteHandler.resolveRequest();

  // then
  await waitForElementToBeRemoved(() =>
    screen.queryByText("Delete credential"),
  );
});

test("CredentialsTablePage: given the delete dialog is open, when Cancel is clicked, then it closes the dialog", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  mswServer.use(listHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete credential");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  // then
  expect(screen.queryByText("Delete credential")).toBeNull();
});

test("CredentialsTablePage: given the delete dialog is open, when deletion is in progress, then it shows 'Deleting...' and disables buttons", async () => {
  // given
  const listHandler = credentialHandler.list({
    data: [CREDENTIAL_API_KEY],
  });
  const deleteHandler = credentialHandler.deleteById();
  mswServer.use(listHandler, deleteHandler);

  testRender(<CredentialsTablePage />);
  listHandler.resolveRequest();
  await screen.findByText("Production API Token");
  await openActionsMenu();
  await userEvent.click(screen.getByText("Delete"));
  await screen.findByText("Delete credential");

  // when
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));

  // then
  expect(await screen.findByText("Deleting...")).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

  deleteHandler.resolveRequest();

  await waitForElementToBeRemoved(() =>
    screen.queryByText("Delete credential"),
  );
});
