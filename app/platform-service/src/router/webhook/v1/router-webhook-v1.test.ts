import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { createHmac } from "crypto";
import Elysia from "elysia";
import { err, ok } from "neverthrow";

import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import type { Project } from "@/module/project/project-model";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/tenant/tenant-model";

import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";
import * as projectIssueFieldDefinitionServiceModule from "@/module/project/project-issue-field-definition-service";
import * as projectServiceModule from "@/module/project/project-service";
import * as workflowDefinitionServiceModule from "@/module/workflow/workflow-definition-service";
import { routerErrorHandler } from "@/router/router-error-handler";
import { Err } from "@/shared/err/err";
import { encodeTenant } from "@/shared/tenant/tenant-encoding";
import { inngestClient } from "@/vendor/inngest/inngest-client";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const WORKFLOW_ID = "019606a0-0000-7000-8000-000000000003" as Id;
const CREDENTIAL_ID = "019606a0-0000-7000-8000-000000000004" as Id;
const AI_AGENT_ID = "019606a0-0000-7000-8000-000000000005" as Id;
const GIT_REPO_ID = "019606a0-0000-7000-8000-000000000006" as Id;
const WORKFLOW_FIELD_ID = "019606a0-0000-7000-8000-000000000007" as Id;
const AI_AGENT_FIELD_ID = "019606a0-0000-7000-8000-000000000008" as Id;
const GIT_REPO_FIELD_ID = "019606a0-0000-7000-8000-000000000009" as Id;

const WORKFLOW_CUSTOM_FIELD_KEY = "customfield_10001";
const AI_AGENT_CUSTOM_FIELD_KEY = "customfield_10002";
const GIT_REPO_CUSTOM_FIELD_KEY = "customfield_10003";

const TENANT: Tenant = { id: TENANT_ID, type: "organization" };
const WEBHOOK_SECRET = "test-webhook-secret";

const mockGetProject = mock();
const mockListFieldDefinitions = mock();
const mockGetWorkflowDefinition = mock();

const projectServiceSpy = spyOn(
  projectServiceModule,
  "makeProjectService",
).mockReturnValue({
  get: mockGetProject,
} as unknown as ReturnType<typeof projectServiceModule.makeProjectService>);

const projectIssueFieldDefinitionServiceSpy = spyOn(
  projectIssueFieldDefinitionServiceModule,
  "makeProjectIssueFieldDefinitionService",
).mockReturnValue({
  list: mockListFieldDefinitions,
} as unknown as ReturnType<
  typeof projectIssueFieldDefinitionServiceModule.makeProjectIssueFieldDefinitionService
>);

const workflowDefinitionServiceSpy = spyOn(
  workflowDefinitionServiceModule,
  "makeWorkflowDefinitionService",
).mockReturnValue({
  get: mockGetWorkflowDefinition,
} as unknown as ReturnType<
  typeof workflowDefinitionServiceModule.makeWorkflowDefinitionService
>);

const mockInngestSend = spyOn(inngestClient, "send");

const { webhookV1Router } =
  await import("@/router/webhook/v1/router-webhook-v1");

// --- Helpers ---

const now = new Date("2026-01-01");

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: PROJECT_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "Project",
  integration: {
    domain: "example.atlassian.net",
    externalId: "10000",
    externalKey: "PROJ",
    provider: "jira",
    webhookSecret: WEBHOOK_SECRET,
    credentialId: CREDENTIAL_ID,
  },
  ...overrides,
});

const makeWorkflow = (
  overrides?: Partial<WorkflowDefinition>,
): WorkflowDefinition => ({
  id: WORKFLOW_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "Workflow",
  projects: [{ id: PROJECT_ID }],
  actions: [],
  edges: [],
  isActive: true,
  ...overrides,
});

const makeFieldDefinition = (input: {
  id: Id;
  name: string;
  externalKey: string;
}): ProjectIssueFieldDefinition => ({
  id: input.id,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: input.name,
  type: "select",
  options: [],
  integration: {
    externalId: input.externalKey,
    externalKey: input.externalKey,
    provider: "jira",
  },
  project: { id: PROJECT_ID },
});

const defaultFieldDefinitions = (): ProjectIssueFieldDefinition[] => [
  makeFieldDefinition({
    id: WORKFLOW_FIELD_ID,
    name: "Workflow Definition",
    externalKey: WORKFLOW_CUSTOM_FIELD_KEY,
  }),
  makeFieldDefinition({
    id: AI_AGENT_FIELD_ID,
    name: "AI Agent",
    externalKey: AI_AGENT_CUSTOM_FIELD_KEY,
  }),
  makeFieldDefinition({
    id: GIT_REPO_FIELD_ID,
    name: "Git Repository",
    externalKey: GIT_REPO_CUSTOM_FIELD_KEY,
  }),
];

const buildJiraEvent = (overrides?: {
  summary?: string;
  description?: string | null;
  workflowDefinitionId?: string | null;
  aiAgentId?: string | null;
  gitRepositoryId?: string | null;
}) => {
  const fields: Record<string, unknown> = {
    summary: overrides?.summary ?? "Issue Title",
    description:
      overrides?.description === undefined
        ? "Issue Body"
        : overrides.description,
  };
  const workflowValue =
    overrides?.workflowDefinitionId === undefined
      ? WORKFLOW_ID
      : overrides.workflowDefinitionId;
  if (workflowValue !== null) {
    fields[WORKFLOW_CUSTOM_FIELD_KEY] = { id: "1", value: workflowValue };
  }
  const aiAgentValue =
    overrides?.aiAgentId === undefined ? AI_AGENT_ID : overrides.aiAgentId;
  if (aiAgentValue !== null) {
    fields[AI_AGENT_CUSTOM_FIELD_KEY] = { id: "2", value: aiAgentValue };
  }
  const gitRepoValue =
    overrides?.gitRepositoryId === undefined
      ? GIT_REPO_ID
      : overrides.gitRepositoryId;
  if (gitRepoValue !== null) {
    fields[GIT_REPO_CUSTOM_FIELD_KEY] = { id: "3", value: gitRepoValue };
  }
  return {
    webhookEvent: "jira:issue_updated" as const,
    issue: {
      id: "10001",
      key: "PROJ-1",
      fields,
    },
  };
};

const sign = (rawBody: string, secret: string) =>
  `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

const resetMocks = () => {
  mockGetProject.mockReset();
  mockListFieldDefinitions.mockReset();
  mockGetWorkflowDefinition.mockReset();
  mockInngestSend.mockReset();
};

const app = new Elysia().use(routerErrorHandler).use(webhookV1Router);

const postJira = (input: {
  body: unknown;
  signature?: string;
  tenantQuery?: string;
  projectId?: string;
}) => {
  const rawBody = JSON.stringify(input.body);
  const tenantQuery = input.tenantQuery ?? encodeTenant(TENANT);
  const projectId = input.projectId ?? PROJECT_ID;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (input.signature !== undefined) {
    headers["x-hub-signature"] = input.signature;
  }
  return app.handle(
    new Request(
      `http://localhost/api/v1/webhook/jira?tenant=${tenantQuery}&projectId=${projectId}`,
      {
        method: "POST",
        headers,
        body: rawBody,
      },
    ),
  );
};

const seedHappyPath = () => {
  mockGetProject.mockResolvedValue(ok({ data: makeProject() }));
  mockListFieldDefinitions.mockResolvedValue(
    ok({ data: defaultFieldDefinitions() }),
  );
  mockGetWorkflowDefinition.mockResolvedValue(ok({ data: makeWorkflow() }));
  mockInngestSend.mockResolvedValue(undefined as never);
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  projectServiceSpy.mockRestore();
  projectIssueFieldDefinitionServiceSpy.mockRestore();
  workflowDefinitionServiceSpy.mockRestore();
  mockInngestSend.mockRestore();
});

test("POST /api/v1/webhook/jira: given a valid signature and all required custom fields, when posted, then sends one triggered event and returns okEnvelope", async () => {
  // given
  seedHappyPath();
  const body = buildJiraEvent();
  const rawBody = JSON.stringify(body);

  // when
  const response = await postJira({
    body,
    signature: sign(rawBody, WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockGetProject).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: PROJECT_ID,
  });
  expect(mockListFieldDefinitions).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    filter: { projectId: PROJECT_ID },
  });
  expect(mockGetWorkflowDefinition).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: WORKFLOW_ID,
  });
  expect(mockInngestSend).toHaveBeenCalledTimes(1);
  expect(mockInngestSend).toHaveBeenCalledWith({
    name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
    data: {
      tenant: TENANT,
      workflowDefinitionId: WORKFLOW_ID,
      aiAgentId: AI_AGENT_ID,
      gitRepositoryId: GIT_REPO_ID,
      title: "Issue Title",
      summary: "Issue Body",
    },
  });
});

test("POST /api/v1/webhook/jira: given the workflow is inactive, when posted, then returns badRequest errEnvelope", async () => {
  // given
  seedHappyPath();
  mockGetWorkflowDefinition.mockResolvedValue(
    ok({ data: makeWorkflow({ isActive: false }) }),
  );
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given the workflow belongs to a different project, when posted, then returns badRequest errEnvelope", async () => {
  // given
  const otherProjectId = "019606a0-0000-7000-8000-0000000000aa" as Id;
  seedHappyPath();
  mockGetWorkflowDefinition.mockResolvedValue(
    ok({ data: makeWorkflow({ projects: [{ id: otherProjectId }] }) }),
  );
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given a field definition is missing, when posted, then returns badRequest errEnvelope", async () => {
  // given
  seedHappyPath();
  mockListFieldDefinitions.mockResolvedValue(
    ok({
      data: defaultFieldDefinitions().filter(
        (d) => d.name !== "Workflow Definition",
      ),
    }),
  );
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockGetWorkflowDefinition).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given the issue is missing the workflow custom field value, when posted, then returns badRequest errEnvelope", async () => {
  // given
  seedHappyPath();
  const body = buildJiraEvent({ workflowDefinitionId: null });

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockGetWorkflowDefinition).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given the issue is missing the ai agent custom field value, when posted, then returns badRequest errEnvelope", async () => {
  // given
  seedHappyPath();
  const body = buildJiraEvent({ aiAgentId: null });

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given a missing signature header, when posted, then returns unauthorized errEnvelope", async () => {
  // given
  const body = buildJiraEvent();

  // when
  const response = await postJira({ body });
  const json = await response.json();

  // then
  expect(json.code).toBe("unauthorized");
  expect(mockGetProject).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given the project is not found, when posted, then returns notFound errEnvelope", async () => {
  // given
  mockGetProject.mockResolvedValue(err(Err.code("notFound")));
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("notFound");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given the project provider is not jira, when posted, then returns notFound errEnvelope", async () => {
  // given
  const project = makeProject({
    integration: {
      domain: "example.com",
      externalId: "10000",
      externalKey: "LIN",
      provider: "linear",
      webhookSecret: WEBHOOK_SECRET,
      credentialId: CREDENTIAL_ID,
    },
  });
  mockGetProject.mockResolvedValue(ok({ data: project }));
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("notFound");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given an invalid signature, when posted, then returns unauthorized errEnvelope", async () => {
  // given
  const project = makeProject();
  mockGetProject.mockResolvedValue(ok({ data: project }));
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), "wrong-secret"),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("unauthorized");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given an invalid tenant query, when posted, then returns badRequest errEnvelope", async () => {
  // given
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
    tenantQuery: encodeURIComponent("not-a-valid-tenant"),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockGetProject).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given an invalid jira event payload, when posted, then returns badRequest errEnvelope", async () => {
  // given
  const project = makeProject();
  mockGetProject.mockResolvedValue(ok({ data: project }));
  const body = { webhookEvent: "jira:issue_updated", issue: { id: "x" } };

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("badRequest");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given the project service fails, when posted, then returns unknown errEnvelope", async () => {
  // given
  mockGetProject.mockResolvedValue(err(Err.code("unknown")));
  const body = buildJiraEvent();

  // when
  const response = await postJira({
    body,
    signature: sign(JSON.stringify(body), WEBHOOK_SECRET),
  });
  const json = await response.json();

  // then
  expect(json.code).toBe("unknown");
  expect(mockInngestSend).not.toHaveBeenCalled();
});
