import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import type { Credential } from "@/module/credential/credential-model";
import type { GitRepository } from "@/module/git-repository/git-repository-model";
import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import type { Project } from "@/module/project/project-model";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import { Err } from "@/shared/err/err";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";
import { makeProjectSyncService } from "./project-sync-service";

// --- Constants ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const CREDENTIAL_ID = "019606a0-0000-7000-8000-000000000020" as Id;
const FIELD_DEF_ID = "019606a0-0000-7000-8000-000000000030" as Id;
const AGENT_ID_1 = "019606a0-0000-7000-8000-000000000041" as Id;
const AGENT_ID_2 = "019606a0-0000-7000-8000-000000000042" as Id;
const REPO_ID_1 = "019606a0-0000-7000-8000-000000000051" as Id;
const REPO_ID_2 = "019606a0-0000-7000-8000-000000000052" as Id;
const WORKFLOW_ID_1 = "019606a0-0000-7000-8000-000000000061" as Id;
const WORKFLOW_ID_2 = "019606a0-0000-7000-8000-000000000062" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };
const now = new Date("2026-01-01");

// --- Mock deps ---

const mockProjectService = {
  create: mock(),
  get: mock(),
  list: mock(),
  update: mock(),
  delete: mock(),
};

const mockCredentialService = {
  create: mock(),
  get: mock(),
  list: mock(),
  update: mock(),
  delete: mock(),
};

const mockAiAgentService = {
  create: mock(),
  get: mock(),
  list: mock(),
  update: mock(),
  delete: mock(),
};

const mockGitRepositoryService = {
  create: mock(),
  get: mock(),
  list: mock(),
  update: mock(),
  delete: mock(),
};

const mockWorkflowDefinitionService = {
  create: mock(),
  get: mock(),
  list: mock(),
  update: mock(),
  delete: mock(),
};

const mockFieldDefService = {
  create: mock(),
  get: mock(),
  list: mock(),
  update: mock(),
  delete: mock(),
};

const mockExternalProjectService = {
  createCustomIssueField: mock(),
  deleteCustomIssueField: mock(),
};

const makeDeps = () => ({
  projectService: mockProjectService as never,
  credentialService: mockCredentialService as never,
  aiAgentService: mockAiAgentService as never,
  gitRepositoryService: mockGitRepositoryService as never,
  workflowDefinitionService: mockWorkflowDefinitionService as never,
  projectIssueFieldDefinitionService: mockFieldDefService as never,
  externalProjectService: mockExternalProjectService as never,
});

// --- Fixture factories ---

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: PROJECT_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Project",
  integration: {
    domain: "myorg.atlassian.net",
    externalId: "ext-proj-1",
    externalKey: "MP",
    provider: "jira",
    webhookSecret: "secret-123",
    credentialId: CREDENTIAL_ID,
  },
  ...overrides,
});

const makeCredentialFixture = (): Credential => ({
  id: CREDENTIAL_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  type: "apiKey" as const,
  name: "Jira API Key",
  apiKey: "sk-test-123",
  expiredAt: new Date("2027-01-01"),
});

const makeAiAgentFixture = (overrides?: Partial<AiAgent>): AiAgent => ({
  id: AGENT_ID_1,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "Agent Alpha",
  model: "anthropic/claude-sonnet-4.6",
  projects: [{ id: PROJECT_ID }],
  ...overrides,
});

const makeGitRepositoryFixture = (
  overrides?: Partial<GitRepository>,
): GitRepository => ({
  id: REPO_ID_1,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "frontend-repo",
  url: "https://github.com/org/frontend",
  config: { defaultBranch: "main", email: "ci@org.com", username: "ci-bot" },
  integration: { provider: "github", credentialId: CREDENTIAL_ID },
  projects: [{ id: PROJECT_ID }],
  ...overrides,
});

const makeWorkflowDefinitionFixture = (
  overrides?: Partial<WorkflowDefinition>,
): WorkflowDefinition => ({
  id: WORKFLOW_ID_1,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "Default Workflow",
  projects: [{ id: PROJECT_ID }],
  actions: [{ id: "a1", kind: "research", name: "Research" }],
  edges: [],
  isActive: true,
  ...overrides,
});

const makeFieldDefinitionFixture = (
  overrides?: Partial<ProjectIssueFieldDefinition>,
): ProjectIssueFieldDefinition => ({
  id: FIELD_DEF_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "AI Agent",
  type: "select",
  options: [{ value: AGENT_ID_1, label: "Agent Alpha" }],
  integration: {
    externalId: "ext-field-1",
    externalKey: "customfield_10001",
    provider: "jira",
  },
  project: { id: PROJECT_ID },
  ...overrides,
});

// --- Reset ---

const resetMocks = () => {
  for (const svc of [
    mockProjectService,
    mockCredentialService,
    mockAiAgentService,
    mockGitRepositoryService,
    mockWorkflowDefinitionService,
    mockFieldDefService,
  ]) {
    for (const fn of Object.values(svc)) {
      (fn as ReturnType<typeof mock>).mockClear();
    }
  }
  mockExternalProjectService.createCustomIssueField.mockClear();
  mockExternalProjectService.deleteCustomIssueField.mockClear();
};

// --- Shared setup helpers ---

const setupResolveSuccess = () => {
  const project = makeProject();
  const credential = makeCredentialFixture();
  mockProjectService.get.mockResolvedValue(ok({ data: project }));
  mockCredentialService.get.mockResolvedValue(ok({ data: credential }));
  return { project, credential };
};

// --- Tests ---

describe("syncAiAgentToExternal", () => {
  beforeEach(resetMocks);

  describe("new field (no existing definition)", () => {
    it("should create issue field definition and sync to external", async () => {
      const { project, credential } = setupResolveSuccess();
      const agents = [
        makeAiAgentFixture({ id: AGENT_ID_1, name: "Agent Alpha" }),
        makeAiAgentFixture({ id: AGENT_ID_2, name: "Agent Beta" }),
      ];
      const createdDef = makeFieldDefinitionFixture({
        integration: null,
        options: [
          { value: AGENT_ID_1, label: "Agent Alpha" },
          { value: AGENT_ID_2, label: "Agent Beta" },
        ],
      });

      mockAiAgentService.list.mockResolvedValue(ok({ data: agents }));
      mockFieldDefService.list.mockResolvedValue(ok({ data: [] }));
      mockFieldDefService.create.mockResolvedValue(ok({ id: FIELD_DEF_ID }));
      mockFieldDefService.get.mockResolvedValue(ok({ data: createdDef }));
      mockExternalProjectService.createCustomIssueField.mockResolvedValue(
        ok({ externalId: "ext-f-1", externalKey: "cf_10001" }),
      );
      mockFieldDefService.update.mockResolvedValue(
        ok({
          data: {
            ...createdDef,
            integration: {
              externalId: "ext-f-1",
              externalKey: "cf_10001",
              provider: "jira",
            },
          },
        }),
      );

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isOk()).toBe(true);

      // Verify field definition created with correct data
      expect(mockFieldDefService.create).toHaveBeenCalledWith({
        ctx,
        payload: {
          type: "select",
          name: "AI Agent",
          options: [
            { label: "Agent Alpha", value: AGENT_ID_1 },
            { label: "Agent Beta", value: AGENT_ID_2 },
          ],
          integration: null,
          project: { id: PROJECT_ID },
        },
      });

      // Verify external field created
      expect(
        mockExternalProjectService.createCustomIssueField,
      ).toHaveBeenCalledWith({
        credential,
        project: expect.objectContaining({ id: PROJECT_ID }),
        projectIssueFieldDefinition: createdDef,
      });

      // Verify definition updated with external integration data
      expect(mockFieldDefService.update).toHaveBeenCalledWith({
        ctx,
        id: FIELD_DEF_ID,
        data: {
          integration: {
            externalId: "ext-f-1",
            externalKey: "cf_10001",
            provider: "jira",
          },
        },
      });
    });
  });

  describe("existing field", () => {
    it("should delete external field, update options, and re-sync", async () => {
      const { project, credential } = setupResolveSuccess();
      const agents = [
        makeAiAgentFixture({ id: AGENT_ID_1, name: "Agent Alpha" }),
        makeAiAgentFixture({ id: AGENT_ID_2, name: "Agent Beta" }),
      ];
      const existingDef = makeFieldDefinitionFixture();
      const updatedDef = makeFieldDefinitionFixture({
        _version: 2,
        options: [
          { value: AGENT_ID_1, label: "Agent Alpha" },
          { value: AGENT_ID_2, label: "Agent Beta" },
        ],
      });

      mockAiAgentService.list.mockResolvedValue(ok({ data: agents }));
      mockFieldDefService.list.mockResolvedValue(ok({ data: [existingDef] }));
      mockExternalProjectService.deleteCustomIssueField.mockResolvedValue(
        ok(undefined),
      );
      mockFieldDefService.update
        .mockResolvedValueOnce(ok({ data: updatedDef }))
        .mockResolvedValueOnce(ok({ data: updatedDef }));
      mockExternalProjectService.createCustomIssueField.mockResolvedValue(
        ok({ externalId: "ext-f-2", externalKey: "cf_10002" }),
      );

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isOk()).toBe(true);

      // Verify external field deleted first
      expect(
        mockExternalProjectService.deleteCustomIssueField,
      ).toHaveBeenCalledWith({
        credential,
        project: expect.objectContaining({ id: PROJECT_ID }),
        projectIssueFieldDefinition: existingDef,
      });

      // Verify options updated
      expect(mockFieldDefService.update).toHaveBeenCalledWith({
        ctx,
        id: FIELD_DEF_ID,
        data: {
          options: [
            { label: "Agent Alpha", value: AGENT_ID_1 },
            { label: "Agent Beta", value: AGENT_ID_2 },
          ],
        },
      });

      // Verify external field re-created with updated definition
      expect(
        mockExternalProjectService.createCustomIssueField,
      ).toHaveBeenCalledWith({
        credential,
        project: expect.objectContaining({ id: PROJECT_ID }),
        projectIssueFieldDefinition: updatedDef,
      });

      // Verify final update with new integration data
      expect(mockFieldDefService.update).toHaveBeenLastCalledWith({
        ctx,
        id: FIELD_DEF_ID,
        data: {
          integration: {
            externalId: "ext-f-2",
            externalKey: "cf_10002",
            provider: "jira",
          },
        },
      });
    });
  });

  describe("error handling", () => {
    it("should return error when project not found", async () => {
      mockProjectService.get.mockResolvedValue(err(Err.code("notFound")));

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
    });

    it("should return error when project has no integration", async () => {
      mockProjectService.get.mockResolvedValue(
        ok({ data: makeProject({ integration: null }) }),
      );

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toHaveProperty("code", "badRequest");
    });

    it("should return error when credential not found", async () => {
      mockProjectService.get.mockResolvedValue(ok({ data: makeProject() }));
      mockCredentialService.get.mockResolvedValue(err(Err.code("notFound")));

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
    });

    it("should return error when listing ai agents fails", async () => {
      setupResolveSuccess();
      mockAiAgentService.list.mockResolvedValue(err(Err.code("unknown")));

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return error when creating external field fails", async () => {
      setupResolveSuccess();
      const agents = [makeAiAgentFixture()];
      const createdDef = makeFieldDefinitionFixture({ integration: null });

      mockAiAgentService.list.mockResolvedValue(ok({ data: agents }));
      mockFieldDefService.list.mockResolvedValue(ok({ data: [] }));
      mockFieldDefService.create.mockResolvedValue(ok({ id: FIELD_DEF_ID }));
      mockFieldDefService.get.mockResolvedValue(ok({ data: createdDef }));
      mockExternalProjectService.createCustomIssueField.mockResolvedValue(
        err(Err.code("unknown", { message: "External API error" })),
      );

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return error when deleting external field fails", async () => {
      setupResolveSuccess();
      const agents = [makeAiAgentFixture()];
      const existingDef = makeFieldDefinitionFixture();

      mockAiAgentService.list.mockResolvedValue(ok({ data: agents }));
      mockFieldDefService.list.mockResolvedValue(ok({ data: [existingDef] }));
      mockExternalProjectService.deleteCustomIssueField.mockResolvedValue(
        err(Err.code("unknown", { message: "External API error" })),
      );

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return error when update returns null data on existing field", async () => {
      setupResolveSuccess();
      const agents = [makeAiAgentFixture()];
      const existingDef = makeFieldDefinitionFixture();

      mockAiAgentService.list.mockResolvedValue(ok({ data: agents }));
      mockFieldDefService.list.mockResolvedValue(ok({ data: [existingDef] }));
      mockExternalProjectService.deleteCustomIssueField.mockResolvedValue(
        ok(undefined),
      );
      mockFieldDefService.update.mockResolvedValue(ok({ data: null }));

      const syncService = makeProjectSyncService(makeDeps());
      const result = await syncService.syncAiAgentToExternal({
        ctx,
        payload: { projectId: PROJECT_ID },
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
    });
  });
});

describe("syncGitRepositoryToExternal", () => {
  beforeEach(resetMocks);

  it("should create new field definition with field name 'Git Repository'", async () => {
    const { credential } = setupResolveSuccess();
    const repos = [
      makeGitRepositoryFixture({ id: REPO_ID_1, name: "frontend-repo" }),
      makeGitRepositoryFixture({ id: REPO_ID_2, name: "backend-repo" }),
    ];
    const createdDef = makeFieldDefinitionFixture({
      name: "Git Repository",
      integration: null,
      options: [
        { value: REPO_ID_1, label: "frontend-repo" },
        { value: REPO_ID_2, label: "backend-repo" },
      ],
    });

    mockGitRepositoryService.list.mockResolvedValue(ok({ data: repos }));
    mockFieldDefService.list.mockResolvedValue(ok({ data: [] }));
    mockFieldDefService.create.mockResolvedValue(ok({ id: FIELD_DEF_ID }));
    mockFieldDefService.get.mockResolvedValue(ok({ data: createdDef }));
    mockExternalProjectService.createCustomIssueField.mockResolvedValue(
      ok({ externalId: "ext-f-1", externalKey: "cf_10001" }),
    );
    mockFieldDefService.update.mockResolvedValue(ok({ data: createdDef }));

    const syncService = makeProjectSyncService(makeDeps());
    const result = await syncService.syncGitRepositoryToExternal({
      ctx,
      payload: { projectId: PROJECT_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(mockFieldDefService.create).toHaveBeenCalledWith({
      ctx,
      payload: expect.objectContaining({
        name: "Git Repository",
        type: "select",
        options: [
          { label: "frontend-repo", value: REPO_ID_1 },
          { label: "backend-repo", value: REPO_ID_2 },
        ],
      }),
    });
  });

  it("should update existing git repository field definition", async () => {
    setupResolveSuccess();
    const repos = [makeGitRepositoryFixture()];
    const existingDef = makeFieldDefinitionFixture({ name: "Git Repository" });
    const updatedDef = makeFieldDefinitionFixture({
      name: "Git Repository",
      _version: 2,
    });

    mockGitRepositoryService.list.mockResolvedValue(ok({ data: repos }));
    mockFieldDefService.list.mockResolvedValue(ok({ data: [existingDef] }));
    mockExternalProjectService.deleteCustomIssueField.mockResolvedValue(
      ok(undefined),
    );
    mockFieldDefService.update
      .mockResolvedValueOnce(ok({ data: updatedDef }))
      .mockResolvedValueOnce(ok({ data: updatedDef }));
    mockExternalProjectService.createCustomIssueField.mockResolvedValue(
      ok({ externalId: "ext-f-2", externalKey: "cf_10002" }),
    );

    const syncService = makeProjectSyncService(makeDeps());
    const result = await syncService.syncGitRepositoryToExternal({
      ctx,
      payload: { projectId: PROJECT_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(mockFieldDefService.list).toHaveBeenCalledWith({
      ctx,
      filter: { projectId: PROJECT_ID, name: "Git Repository" },
    });
  });
});

describe("syncWorkflowDefinitionToExternal", () => {
  beforeEach(resetMocks);

  it("should create new field definition with field name 'Workflow Definition'", async () => {
    setupResolveSuccess();
    const workflows = [
      makeWorkflowDefinitionFixture({
        id: WORKFLOW_ID_1,
        name: "Default Workflow",
      }),
      makeWorkflowDefinitionFixture({
        id: WORKFLOW_ID_2,
        name: "Custom Workflow",
      }),
    ];
    const createdDef = makeFieldDefinitionFixture({
      name: "Workflow Definition",
      integration: null,
      options: [
        { value: WORKFLOW_ID_1, label: "Default Workflow" },
        { value: WORKFLOW_ID_2, label: "Custom Workflow" },
      ],
    });

    mockWorkflowDefinitionService.list.mockResolvedValue(
      ok({ data: workflows }),
    );
    mockFieldDefService.list.mockResolvedValue(ok({ data: [] }));
    mockFieldDefService.create.mockResolvedValue(ok({ id: FIELD_DEF_ID }));
    mockFieldDefService.get.mockResolvedValue(ok({ data: createdDef }));
    mockExternalProjectService.createCustomIssueField.mockResolvedValue(
      ok({ externalId: "ext-f-1", externalKey: "cf_10001" }),
    );
    mockFieldDefService.update.mockResolvedValue(ok({ data: createdDef }));

    const syncService = makeProjectSyncService(makeDeps());
    const result = await syncService.syncWorkflowDefinitionToExternal({
      ctx,
      payload: { projectId: PROJECT_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(mockFieldDefService.create).toHaveBeenCalledWith({
      ctx,
      payload: expect.objectContaining({
        name: "Workflow Definition",
        type: "select",
        options: [
          { label: "Default Workflow", value: WORKFLOW_ID_1 },
          { label: "Custom Workflow", value: WORKFLOW_ID_2 },
        ],
      }),
    });
  });

  it("should update existing workflow definition field definition", async () => {
    setupResolveSuccess();
    const workflows = [makeWorkflowDefinitionFixture()];
    const existingDef = makeFieldDefinitionFixture({
      name: "Workflow Definition",
    });
    const updatedDef = makeFieldDefinitionFixture({
      name: "Workflow Definition",
      _version: 2,
    });

    mockWorkflowDefinitionService.list.mockResolvedValue(
      ok({ data: workflows }),
    );
    mockFieldDefService.list.mockResolvedValue(ok({ data: [existingDef] }));
    mockExternalProjectService.deleteCustomIssueField.mockResolvedValue(
      ok(undefined),
    );
    mockFieldDefService.update
      .mockResolvedValueOnce(ok({ data: updatedDef }))
      .mockResolvedValueOnce(ok({ data: updatedDef }));
    mockExternalProjectService.createCustomIssueField.mockResolvedValue(
      ok({ externalId: "ext-f-2", externalKey: "cf_10002" }),
    );

    const syncService = makeProjectSyncService(makeDeps());
    const result = await syncService.syncWorkflowDefinitionToExternal({
      ctx,
      payload: { projectId: PROJECT_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(mockFieldDefService.list).toHaveBeenCalledWith({
      ctx,
      filter: { projectId: PROJECT_ID, name: "Workflow Definition" },
    });
  });
});
