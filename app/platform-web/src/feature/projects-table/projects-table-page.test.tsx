import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/module/project/project-type";
import { makeProjectMswHandler } from "@/test/msw/msw-project-handler";
import { mswServer } from "@/test/msw/msw-server";
import { testRender } from "@/test/test-render";
import ProjectsTablePage from "./projects-table-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/platform/project",
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
  updatedAt: "2026-02-20T14:00:00.000Z",
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

describe("ProjectsTablePage", () => {
  it("renders project list from API", async () => {
    mswServer.use(projectHandler.list([PROJECT_1, PROJECT_2]));

    testRender(<ProjectsTablePage />);

    expect(await screen.findByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText("Beta Project")).toBeInTheDocument();
  });

  it("renders the page heading", async () => {
    mswServer.use(projectHandler.list([]));

    testRender(<ProjectsTablePage />);

    await waitFor(() => {
      expect(screen.getByText("Project")).toBeInTheDocument();
    });
  });

  it("renders the New Project button", async () => {
    mswServer.use(projectHandler.list([]));

    testRender(<ProjectsTablePage />);

    expect(await screen.findByText("New Project")).toBeInTheDocument();
  });

  it("shows 'No results.' when project list is empty", async () => {
    mswServer.use(projectHandler.list([]));

    testRender(<ProjectsTablePage />);

    expect(await screen.findByText("No results.")).toBeInTheDocument();
  });

  it("renders column headers", async () => {
    mswServer.use(projectHandler.list([PROJECT_1]));

    testRender(<ProjectsTablePage />);

    await screen.findByText("Alpha Project");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
  });

  it("renders formatted created date", async () => {
    mswServer.use(projectHandler.list([PROJECT_1]));

    testRender(<ProjectsTablePage />);

    expect(await screen.findByText("Jan 15, 2026, 10:30 AM")).toBeInTheDocument();
  });

  it("renders project name as a link to the project detail page", async () => {
    mswServer.use(projectHandler.list([PROJECT_1]));

    testRender(<ProjectsTablePage />);

    const link = await screen.findByRole("link", { name: "Alpha Project" });
    expect(link).toHaveAttribute(
      "href",
      `/platform/project/${PROJECT_1.id}`,
    );
  });

  it("renders the New Project button linking to /platform/project/new", async () => {
    mswServer.use(projectHandler.list([]));

    testRender(<ProjectsTablePage />);

    const button = await screen.findByRole("button", { name: /New Project/i });
    expect(button).toHaveAttribute("href", "/platform/project/new");
  });
});
