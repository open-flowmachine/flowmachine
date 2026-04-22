import { beforeEach, expect, mock, test } from "bun:test";

import type { Id } from "@/shared/model/model-id";

import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const WORKFLOW_DEFINITION_ID = "019606a0-0000-7000-8000-000000000002" as Id;

const mockInngestSend = mock();

mock.module("@/vendor/inngest/inngest-client", () => ({
  inngestClient: {
    send: mockInngestSend,
  },
}));

const { workflowExecutionV1Router } = await import(
  "@/router/workflow/v1/router-workflow-execution-v1"
);

// --- Helpers ---

const resetMocks = () => {
  mockInngestSend.mockClear();
};

const app = workflowExecutionV1Router;

const request = (method: string, path: string, body?: unknown) => {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return app.handle(new Request(`http://localhost${path}`, init));
};

// --- Tests ---

beforeEach(resetMocks);

test("POST /api/v1/workflow-execution: given a valid body, when posted, then sends the triggered event and returns okEnvelope", async () => {
  // given
  mockInngestSend.mockResolvedValue(undefined);

  // when
  const response = await request("POST", "/api/v1/workflow-execution", {
    tenant: { id: TENANT_ID, type: "organization" },
    workflowDefinitionId: WORKFLOW_DEFINITION_ID,
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockInngestSend).toHaveBeenCalledTimes(1);
  expect(mockInngestSend).toHaveBeenCalledWith({
    name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
    data: {
      tenant: { id: TENANT_ID, type: "organization" },
      workflowDefinitionId: WORKFLOW_DEFINITION_ID,
    },
  });
});

test("POST /api/v1/workflow-execution: given a body missing workflowDefinitionId, when posted, then does not send an event and returns a validation error", async () => {
  // given
  mockInngestSend.mockResolvedValue(undefined);

  // when
  const response = await request("POST", "/api/v1/workflow-execution", {
    tenant: { id: TENANT_ID, type: "organization" },
  });

  // then
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/workflow-execution: given a body with an invalid tenant type, when posted, then does not send an event and returns a validation error", async () => {
  // given
  mockInngestSend.mockResolvedValue(undefined);

  // when
  const response = await request("POST", "/api/v1/workflow-execution", {
    tenant: { id: TENANT_ID, type: "not-a-valid-type" },
    workflowDefinitionId: WORKFLOW_DEFINITION_ID,
  });

  // then
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(mockInngestSend).not.toHaveBeenCalled();
});
