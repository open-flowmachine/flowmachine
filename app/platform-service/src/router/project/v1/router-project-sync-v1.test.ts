import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import Elysia from "elysia";
import { err, ok } from "neverthrow";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/tenant/tenant-model";

import * as projectSyncServiceModule from "@/feature/project/project-sync-service";
import { routerErrorHandler } from "@/router/router-error-handler";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockSyncAiAgentToExternal = mock();
const mockSyncGitRepositoryToExternal = mock();
const mockSyncWorkflowDefinitionToExternal = mock();

const makeServiceSpy = spyOn(
  projectSyncServiceModule,
  "makeProjectSyncService",
).mockReturnValue({
  syncAiAgentToExternal: mockSyncAiAgentToExternal,
  syncGitRepositoryToExternal: mockSyncGitRepositoryToExternal,
  syncWorkflowDefinitionToExternal: mockSyncWorkflowDefinitionToExternal,
});

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

const { projectSyncV1Router } =
  await import("@/router/project/v1/router-project-sync-v1");

// --- Helpers ---

const resetMocks = () => {
  mockSyncAiAgentToExternal.mockReset();
  mockSyncGitRepositoryToExternal.mockReset();
  mockSyncWorkflowDefinitionToExternal.mockReset();
  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
};

const app = new Elysia().use(routerErrorHandler).use(projectSyncV1Router);

const post = (projectId: string) =>
  app.handle(
    new Request(`http://localhost/api/v1/project/${projectId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }),
  );

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  makeServiceSpy.mockRestore();
  getSessionSpy.mockRestore();
});

test("POST /api/v1/project/:projectId/sync: given all sync operations succeed, when posted, then returns okEnvelope and invokes each sync with the tenant and projectId", async () => {
  // given
  mockSyncAiAgentToExternal.mockResolvedValue(ok());
  mockSyncGitRepositoryToExternal.mockResolvedValue(ok());
  mockSyncWorkflowDefinitionToExternal.mockResolvedValue(ok());

  // when
  const response = await post(PROJECT_ID);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  const expectedInput = {
    ctx: { tenant: TENANT },
    payload: { projectId: PROJECT_ID },
  };
  expect(mockSyncAiAgentToExternal).toHaveBeenCalledWith(expectedInput);
  expect(mockSyncGitRepositoryToExternal).toHaveBeenCalledWith(expectedInput);
  expect(mockSyncWorkflowDefinitionToExternal).toHaveBeenCalledWith(
    expectedInput,
  );
});

test("POST /api/v1/project/:projectId/sync: given one sync operation fails, when posted, then returns the first errEnvelope", async () => {
  // given
  mockSyncAiAgentToExternal.mockResolvedValue(ok());
  mockSyncGitRepositoryToExternal.mockResolvedValue(err(Err.code("notFound")));
  mockSyncWorkflowDefinitionToExternal.mockResolvedValue(ok());

  // when
  const response = await post(PROJECT_ID);
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("POST /api/v1/project/:projectId/sync: given the auth guard rejects, when posted without a session, then returns unauthorized errEnvelope and does not call any sync", async () => {
  // given
  getSessionSpy.mockResolvedValue(null as never);

  // when
  const response = await post(PROJECT_ID);
  const json = await response.json();

  // then
  expect(json.code).toBe("unauthorized");
  expect(mockSyncAiAgentToExternal).not.toHaveBeenCalled();
  expect(mockSyncGitRepositoryToExternal).not.toHaveBeenCalled();
  expect(mockSyncWorkflowDefinitionToExternal).not.toHaveBeenCalled();
});
