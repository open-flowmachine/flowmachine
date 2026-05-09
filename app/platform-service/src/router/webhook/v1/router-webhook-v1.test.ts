import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { createHmac } from "crypto";
import Elysia from "elysia";
import { err, ok } from "neverthrow";

import type { Project } from "@/module/project/project-model";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/tenant/tenant-model";

import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";
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

const TENANT: Tenant = { id: TENANT_ID, type: "organization" };
const WEBHOOK_SECRET = "test-webhook-secret";

const mockListProjects = mock();
const mockListWorkflowDefinitions = mock();

const projectServiceSpy = spyOn(
  projectServiceModule,
  "makeProjectService",
).mockReturnValue({
  list: mockListProjects,
} as unknown as ReturnType<typeof projectServiceModule.makeProjectService>);

const workflowDefinitionServiceSpy = spyOn(
  workflowDefinitionServiceModule,
  "makeWorkflowDefinitionService",
).mockReturnValue({
  list: mockListWorkflowDefinitions,
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

const buildJiraEvent = (overrides?: {
  summary?: string;
  description?: string | null;
}) => ({
  webhookEvent: "jira:issue_updated" as const,
  issue: {
    id: "10001",
    key: "PROJ-1",
    fields: {
      summary: overrides?.summary ?? "Issue Title",
      description:
        overrides?.description === undefined
          ? "Issue Body"
          : overrides.description,
    },
  },
});

const sign = (rawBody: string, secret: string) =>
  `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

const resetMocks = () => {
  mockListProjects.mockReset();
  mockListWorkflowDefinitions.mockReset();
  mockInngestSend.mockReset();
};

const app = new Elysia().use(routerErrorHandler).use(webhookV1Router);

const postJira = (input: {
  body: unknown;
  signature?: string;
  tenantQuery?: string;
}) => {
  const rawBody = JSON.stringify(input.body);
  const tenantQuery = input.tenantQuery ?? encodeTenant(TENANT);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (input.signature !== undefined) {
    headers["x-hub-signature"] = input.signature;
  }
  return app.handle(
    new Request(`http://localhost/api/v1/webhook/jira?tenant=${tenantQuery}`, {
      method: "POST",
      headers,
      body: rawBody,
    }),
  );
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  projectServiceSpy.mockRestore();
  workflowDefinitionServiceSpy.mockRestore();
  mockInngestSend.mockRestore();
});

test("POST /api/v1/webhook/jira: given a valid signature and an active workflow, when posted, then sends triggered events and returns okEnvelope", async () => {
  // given
  const project = makeProject();
  const workflow = makeWorkflow();
  mockListProjects.mockResolvedValue(ok({ data: [project] }));
  mockListWorkflowDefinitions.mockResolvedValue(ok({ data: [workflow] }));
  mockInngestSend.mockResolvedValue(undefined as never);
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
  expect(mockInngestSend).toHaveBeenCalledTimes(1);
  expect(mockInngestSend).toHaveBeenCalledWith([
    {
      name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
      data: {
        tenant: TENANT,
        workflowDefinitionId: WORKFLOW_ID,
        title: "Issue Title",
        summary: "Issue Body",
      },
    },
  ]);
});

test("POST /api/v1/webhook/jira: given inactive workflows, when posted, then does not send any events", async () => {
  // given
  const project = makeProject();
  const inactiveWorkflow = makeWorkflow({ isActive: false });
  mockListProjects.mockResolvedValue(ok({ data: [project] }));
  mockListWorkflowDefinitions.mockResolvedValue(
    ok({ data: [inactiveWorkflow] }),
  );
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
  expect(mockListProjects).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given an invalid signature, when posted, then returns unauthorized errEnvelope", async () => {
  // given
  const project = makeProject();
  mockListProjects.mockResolvedValue(ok({ data: [project] }));
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
  expect(mockListProjects).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/webhook/jira: given an invalid jira event payload, when posted, then returns badRequest errEnvelope", async () => {
  // given
  const project = makeProject();
  mockListProjects.mockResolvedValue(ok({ data: [project] }));
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

test("POST /api/v1/webhook/jira: given the project list service fails, when posted, then returns unknown errEnvelope", async () => {
  // given
  mockListProjects.mockResolvedValue(err(Err.code("unknown")));
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
