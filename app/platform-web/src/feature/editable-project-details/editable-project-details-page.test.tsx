import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/module/project/project-type";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";
import { EditableProjectDetailsPage } from "./editable-project-details-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/project/01961a2b-0000-7000-8000-000000000002",
}));

const projectHandler = makeProjectMswHandler();

const PROJECT_1: Project = {
  id: "01961a2b-0000-7000-8000-000000000001",
  createdAt: "2026-01-15T10:30:00.000Z",
  updatedAt: "2026-01-15T10:30:00.000Z",
  name: "Alpha Project",
  tenant: { id: "01961a2b-0000-7000-8000-000000000099", type: "organization" },
};

const PROJECT_2: Project = {
  id: "01961a2b-0000-7000-8000-000000000002",
  createdAt: "2026-02-20T14:00:00.000Z",
  updatedAt: "2026-03-10T09:15:00.000Z",
  name: "Beta Project",
  tenant: { id: "01961a2b-0000-7000-8000-000000000099", type: "organization" },
  integration: {
    domain: "example.atlassian.net",
    externalId: "10001",
    externalKey: "BETA",
    provider: "jira",
    webhookSecret: "secret",
    credentialId: "01961a2b-0000-7000-8000-000000000050",
  },
};

describe("EditableProjectDetailsPage", () => {
  it("renders project name as the page heading", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    const heading = await screen.findByRole("heading", {
      name: "Beta Project",
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders project ID", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(await screen.findByText(PROJECT_2.id)).toBeInTheDocument();
  });

  it("renders project name in the details view", async () => {
    mswServer.use(projectHandler.getById(PROJECT_1));

    testRender(<EditableProjectDetailsPage id={PROJECT_1.id} />);

    const heading = await screen.findByRole("heading", {
      name: "Alpha Project",
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders formatted created date", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(
      await screen.findByText("Feb 20, 2026, 2:00 PM"),
    ).toBeInTheDocument();
  });

  it("renders formatted updated date", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(
      await screen.findByText("Mar 10, 2026, 9:15 AM"),
    ).toBeInTheDocument();
  });

  it("renders integration provider badge for a project with integration", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(await screen.findByText("Jira")).toBeInTheDocument();
  });

  it("renders integration domain", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(
      await screen.findByText("example.atlassian.net"),
    ).toBeInTheDocument();
  });

  it("renders integration credential ID", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(
      await screen.findByText("01961a2b-0000-7000-8000-000000000050"),
    ).toBeInTheDocument();
  });

  it("renders integration external ID", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(await screen.findByText("10001")).toBeInTheDocument();
  });

  it("renders integration external key", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(await screen.findByText("BETA")).toBeInTheDocument();
  });

  it("renders integration webhook secret", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(await screen.findByText("secret")).toBeInTheDocument();
  });

  it("does not render integration section for a project without integration", async () => {
    mswServer.use(projectHandler.getById(PROJECT_1));

    testRender(<EditableProjectDetailsPage id={PROJECT_1.id} />);

    await screen.findByRole("heading", { name: "Alpha Project" });

    expect(screen.queryByText("Integration")).not.toBeInTheDocument();
  });

  it("renders the Edit button", async () => {
    mswServer.use(projectHandler.getById(PROJECT_2));

    testRender(<EditableProjectDetailsPage id={PROJECT_2.id} />);

    expect(
      await screen.findByRole("button", { name: "Edit" }),
    ).toBeInTheDocument();
  });

  it("shows not-found error when API returns an error", async () => {
    mswServer.use(projectHandler.getByIdError(404));

    testRender(<EditableProjectDetailsPage id="nonexistent-id" />);

    await waitFor(() => {
      expect(screen.getByText("404 - Not Found")).toBeInTheDocument();
    });
  });
});
