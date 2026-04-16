import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("CredentialsTablePage", () => {
  it("renders credential list from API", async () => {
    const listHandler = credentialHandler.list({
      data: [CREDENTIAL_API_KEY, CREDENTIAL_BASIC],
    });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Production API Token")).toBeVisible();
    expect(screen.getByText("Staging Basic Auth")).toBeVisible();
  });

  it("renders the page heading", async () => {
    const listHandler = credentialHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Credential")).toBeVisible();
  });

  it("renders the New Credential button", async () => {
    const listHandler = credentialHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("New Credential")).toBeVisible();
  });

  it("shows 'No results.' when credential list is empty", async () => {
    const listHandler = credentialHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("No results.")).toBeVisible();
  });

  it("renders column headers", async () => {
    const listHandler = credentialHandler.list({ data: [CREDENTIAL_API_KEY] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    await screen.findByText("Production API Token");

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.getByText("Type")).toBeVisible();
    expect(screen.getByText("Key Info")).toBeVisible();
    expect(screen.getByText("Expired At")).toBeVisible();
    expect(screen.getByText("Created")).toBeVisible();
  });

  it("renders formatted created date", async () => {
    const listHandler = credentialHandler.list({ data: [CREDENTIAL_API_KEY] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
  });

  it("renders credential name as a link to the credential detail page", async () => {
    const listHandler = credentialHandler.list({ data: [CREDENTIAL_API_KEY] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    const link = await screen.findByRole("link", {
      name: "Production API Token",
    });
    expect(link).toHaveAttribute(
      "href",
      `/platform/credential/${CREDENTIAL_API_KEY.id}`,
    );
  });

  it("renders the New Credential button linking to /platform/credential/new", async () => {
    const listHandler = credentialHandler.list({ data: [] });
    mswServer.use(listHandler);

    testRender(<CredentialsTablePage />);

    listHandler.resolveRequest();

    const button = await screen.findByRole("button", {
      name: /New Credential/i,
    });
    expect(button).toHaveAttribute("href", "/platform/credential/new");
  });

  describe("actions dropdown menu", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("opens the dropdown and shows all menu items", async () => {
      const listHandler = credentialHandler.list({
        data: [CREDENTIAL_API_KEY],
      });
      mswServer.use(listHandler);

      testRender(<CredentialsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Production API Token");
      await openActionsMenu();

      expect(screen.getByText("Copy")).toBeVisible();
      expect(screen.getByText("Edit")).toBeVisible();
      expect(screen.getByText("Delete")).toBeVisible();
    });
  });

  describe("copy action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    const originalClipboard = navigator.clipboard;

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    afterEach(() => {
      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it("copies credential ID to clipboard and shows success toast", async () => {
      const listHandler = credentialHandler.list({
        data: [CREDENTIAL_API_KEY],
      });
      mswServer.use(listHandler);

      testRender(<CredentialsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Production API Token");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Copy"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        CREDENTIAL_API_KEY.id,
      );
      expect(await screen.findByText("Copied to clipboard")).toBeVisible();
    });
  });

  describe("edit action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("edit menu item links to the credential detail page", async () => {
      const listHandler = credentialHandler.list({
        data: [CREDENTIAL_API_KEY],
      });
      mswServer.use(listHandler);

      testRender(<CredentialsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Production API Token");
      await openActionsMenu();

      const editLink = screen.getByRole("menuitem", { name: /Edit/ });
      expect(editLink).toHaveAttribute(
        "href",
        `/platform/credential/${CREDENTIAL_API_KEY.id}`,
      );
    });
  });

  describe("delete action", () => {
    const openActionsMenu = async () => {
      const menuButton = await screen.findByRole("button", {
        name: "Open menu",
      });
      await userEvent.click(menuButton);
      await screen.findByRole("menu");
    };

    it("clicking Delete opens the confirmation dialog", async () => {
      const listHandler = credentialHandler.list({
        data: [CREDENTIAL_API_KEY],
      });
      mswServer.use(listHandler);

      testRender(<CredentialsTablePage />);

      listHandler.resolveRequest();

      await screen.findByText("Production API Token");
      await openActionsMenu();
      await userEvent.click(screen.getByText("Delete"));

      expect(await screen.findByText("Delete credential")).toBeVisible();
    });

    it("confirmation dialog shows description text", async () => {
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
      expect(screen.getByText(/Are you sure you want to delete/)).toBeVisible();
    });

    it("confirming deletion calls API and closes dialog", async () => {
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
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete credential"),
      );
    });

    it("canceling deletion closes the dialog", async () => {
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
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByText("Delete credential")).toBeNull();
    });

    it("shows 'Deleting...' and disables buttons while deletion is in progress", async () => {
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
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Deleting...")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      deleteHandler.resolveRequest();

      await waitForElementToBeRemoved(() =>
        screen.queryByText("Delete credential"),
      );
    });
  });
});
