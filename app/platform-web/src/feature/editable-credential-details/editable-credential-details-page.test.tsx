import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const waitForCredentialToLoad = async () => {
  await screen.findByRole("button", { name: "Edit" });
};

describe("EditableCredentialDetailsPage", () => {
  describe("view mode", () => {
    it("renders credential name as page heading", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Production API Token",
      );
    });

    it("displays credential ID", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText(CREDENTIAL_API_KEY.id)).toBeVisible();
    });

    it("displays credential name in details", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      const nameElements = screen.getAllByText("Production API Token");
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it("displays type badge", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      const apiKeyElements = screen.getAllByText("API Key");
      expect(apiKeyElements.length).toBeGreaterThanOrEqual(2);
    });

    it("displays masked API key value", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      // sk-1234567890abcdef (18 chars) → sk-1 + masked middle + cdef
      expect(screen.getByText(/sk-1.*cdef/)).toBeVisible();
    });

    it("displays formatted created at timestamp", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeVisible();
    });

    it("displays formatted updated at timestamp", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 20, 2026, 2:00 PM")).toBeVisible();
    });

    it("displays formatted expired at timestamp", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("Jan 15, 2027, 10:30 AM")).toBeVisible();
    });

    it("renders Edit button", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("displays Password field for basic type", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_BASIC,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_BASIC.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      expect(screen.getByText("Password")).toBeVisible();
      expect(screen.getByText("••••••••")).toBeVisible();
    });

    it("does not display Password field for apiKey type", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      expect(screen.queryByText("Password")).toBeNull();
    });
  });

  describe("404 error", () => {
    it("shows 404 when API returns error", async () => {
      const getByIdHandler = credentialHandler.getById({
        status: 500,
        code: "error",
        message: "error",
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id="non-existent-id" />);

      getByIdHandler.resolveRequest();

      expect(await screen.findByText("404 - Not Found")).toBeVisible();
    });
  });

  describe("copy action", () => {
    const originalClipboard = navigator.clipboard;

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    afterEach(() => {
      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it("copies credential ID to clipboard and shows toast", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();

      const copyButtons = screen.getAllByRole("button");
      const copyButton = copyButtons.find((btn) =>
        btn.querySelector(".lucide-copy"),
      )!;
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        CREDENTIAL_API_KEY.id,
      );
      expect(await screen.findByText("Copied to clipboard")).toBeVisible();
    });
  });

  describe("edit mode", () => {
    it("clicking Edit switches to edit form", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
    });

    it("edit form is pre-populated with apiKey credential data", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await screen.findByRole("button", { name: "Edit" });
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toHaveValue("Production API Token");
      expect(screen.getByLabelText("API Key")).toHaveValue(
        "sk-1234567890abcdef",
      );
    });

    it("edit form is pre-populated with basic credential data", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_BASIC,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_BASIC.id} />);

      getByIdHandler.resolveRequest();

      await screen.findByRole("button", { name: "Edit" });
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toHaveValue("Staging Basic Auth");
      expect(screen.getByLabelText("Username")).toHaveValue("admin-user");
      expect(screen.getByLabelText("Password")).toHaveValue("secret-password");
    });

    it("clicking Cancel returns to view mode", async () => {
      const getByIdHandler = credentialHandler.getById({
        data: CREDENTIAL_API_KEY,
      });
      mswServer.use(getByIdHandler);

      testRender(<EditableCredentialDetailsPage id={CREDENTIAL_API_KEY.id} />);

      getByIdHandler.resolveRequest();

      await waitForCredentialToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toBeVisible();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    });

    it("successful update shows toast and returns to view mode", async () => {
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

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      updateHandler.resolveRequest();

      expect(
        await screen.findByText("Credential updated successfully"),
      ).toBeVisible();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("failed update shows error toast", async () => {
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
      updateHandler.resolveRequest();

      await waitForCredentialToLoad();
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));

      await userEvent.clear(screen.getByLabelText("Name"));
      await userEvent.type(screen.getByLabelText("Name"), "Updated Token");

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(
        await screen.findByText("Failed to update credential"),
      ).toBeVisible();
    });

    it("shows 'Saving...' while update is in progress", async () => {
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

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Saving...")).toBeVisible();

      updateHandler.resolveRequest();
    });
  });
});
