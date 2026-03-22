import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/module/project/project-type";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";
import { NewProjectPage } from "./new-project-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/project/new",
}));

const projectHandler = makeProjectMswHandler();

const PROJECT_1: Project = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  name: "Alpha Project",
  tenant: { id: "01961a2b-0000-7000-8000-000000000099", type: "organization" },
};

describe("NewProjectPage", () => {
  it("renders the page heading", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByText("New Project")).toBeInTheDocument();
    });
  });

  it("renders the Basic details fieldset", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByText("Basic details")).toBeInTheDocument();
    });
  });

  it("renders the Integration fieldset", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByText("Integration")).toBeInTheDocument();
    });
  });

  it("renders the Name input field", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });
  });

  it("renders the Domain input field", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Domain")).toBeInTheDocument();
    });
  });

  it("renders the Credential ID input field", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Credential ID")).toBeInTheDocument();
    });
  });

  it("renders the External ID input field", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("External ID")).toBeInTheDocument();
    });
  });

  it("renders the External Key input field", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("External Key")).toBeInTheDocument();
    });
  });

  it("renders the Webhook Secret input field", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Webhook Secret")).toBeInTheDocument();
    });
  });

  it("renders the Save button", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save" }),
      ).toBeInTheDocument();
    });
  });

  it("renders the Reset button", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Reset" }),
      ).toBeInTheDocument();
    });
  });

  it("renders the Save button as enabled by default", async () => {
    mswServer.use(projectHandler.create(PROJECT_1));

    testRender(<NewProjectPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });
  });
});
