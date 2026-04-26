import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import { Err } from "@/shared/err/err";
import * as jiraClientModule from "@/vendor/jira/jira-client";
import { makeJiraService } from "@/vendor/jira/jira-service";

// --- Mock setup ---

const mockCreateCustomField = mock();
const mockCreateCustomFieldContextOptions = mock();
const mockCreateCustomFieldAssociations = mock();
const mockGetCustomFieldContexts = mock();
const mockGetProject = mock();
const mockDeleteField = mock();

const mockJiraClient = {
  createCustomField: mockCreateCustomField,
  createCustomFieldContextOptions: mockCreateCustomFieldContextOptions,
  createCustomFieldAssociations: mockCreateCustomFieldAssociations,
  getCustomFieldContexts: mockGetCustomFieldContexts,
  getProject: mockGetProject,
  deleteField: mockDeleteField,
};

const makeJiraClientSpy = spyOn(
  jiraClientModule,
  "makeJiraClient",
).mockReturnValue(mockJiraClient);

// --- Helpers ---

const basicCredential = {
  type: "basic" as const,
  username: "user@example.com",
  password: "api-token",
};

const projectWithIntegration = {
  integration: { domain: "my-company", externalId: "10000" },
};

const fieldDefinition = {
  name: "Status Field",
  options: [{ value: "Open" }, { value: "Closed" }],
};

const fieldDefinitionWithIntegration = {
  ...fieldDefinition,
  integration: { externalId: "customfield_10001", externalKey: "cf_10001" },
};

const resetMocks = () => {
  mockCreateCustomField.mockReset();
  mockCreateCustomFieldContextOptions.mockReset();
  mockCreateCustomFieldAssociations.mockReset();
  mockGetCustomFieldContexts.mockReset();
  mockGetProject.mockReset();
  mockDeleteField.mockReset();
  makeJiraClientSpy.mockClear();
  makeJiraClientSpy.mockReturnValue(mockJiraClient);
};

// --- Tests ---

const service = makeJiraService();

beforeEach(resetMocks);

afterAll(() => {
  makeJiraClientSpy.mockRestore();
});

test("createCustomIssueField: given a project with no integration, when called, then returns badRequest err", async () => {
  // given

  // when
  const result = await service.createCustomIssueField({
    credential: basicCredential,
    project: { integration: null },
    fieldDefinition,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr().code).toBe("badRequest");
});

test("createCustomIssueField: given a non-basic credential, when called, then returns badRequest err", async () => {
  // given

  // when
  const result = await service.createCustomIssueField({
    credential: { type: "oauth" as "basic", username: "", password: "" },
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr().code).toBe("badRequest");
});

test("createCustomIssueField: given valid inputs, when createCustomField fails, then returns err", async () => {
  // given
  mockCreateCustomField.mockResolvedValue(err(Err.code("unknown")));

  // when
  const result = await service.createCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(result.isErr()).toBe(true);
});

test("createCustomIssueField: given valid inputs, when createCustomFieldAssociations fails, then returns err", async () => {
  // given
  mockCreateCustomField.mockResolvedValue(
    ok({ id: "cf_1", key: "cf_1", name: "Test", custom: true }),
  );
  mockCreateCustomFieldAssociations.mockResolvedValue(
    err(Err.code("unknown")),
  );

  // when
  const result = await service.createCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(result.isErr()).toBe(true);
});

test("createCustomIssueField: given valid inputs, when getCustomFieldContexts fails, then returns err", async () => {
  // given
  mockCreateCustomField.mockResolvedValue(
    ok({ id: "cf_1", key: "cf_1", name: "Test", custom: true }),
  );
  mockCreateCustomFieldAssociations.mockResolvedValue(ok(undefined));
  mockGetCustomFieldContexts.mockResolvedValue(err(Err.code("unknown")));

  // when
  const result = await service.createCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(result.isErr()).toBe(true);
});

test("createCustomIssueField: given valid inputs, when no context is found, then returns notFound err", async () => {
  // given
  mockCreateCustomField.mockResolvedValue(
    ok({ id: "cf_1", key: "cf_1", name: "Test", custom: true }),
  );
  mockCreateCustomFieldAssociations.mockResolvedValue(ok(undefined));
  mockGetCustomFieldContexts.mockResolvedValue(ok({ values: [] }));

  // when
  const result = await service.createCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr().code).toBe("notFound");
});

test("createCustomIssueField: given valid inputs, when all steps succeed, then returns ok with externalId and externalKey", async () => {
  // given
  mockCreateCustomField.mockResolvedValue(
    ok({
      id: "cf_1",
      key: "customfield_10001",
      name: "Test",
      custom: true,
    }),
  );
  mockCreateCustomFieldAssociations.mockResolvedValue(ok(undefined));
  mockGetCustomFieldContexts.mockResolvedValue(
    ok({ values: [{ id: "ctx_1" }] }),
  );
  mockCreateCustomFieldContextOptions.mockResolvedValue(
    ok({ options: [{ id: "1", value: "Open", disabled: false }] }),
  );

  // when
  const result = await service.createCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({
    externalId: "cf_1",
    externalKey: "customfield_10001",
  });
});

test("createCustomIssueField: given field options, when called, then passes options to createCustomFieldContextOptions", async () => {
  // given
  mockCreateCustomField.mockResolvedValue(
    ok({ id: "cf_1", key: "cf_key", name: "Test", custom: true }),
  );
  mockCreateCustomFieldAssociations.mockResolvedValue(ok(undefined));
  mockGetCustomFieldContexts.mockResolvedValue(
    ok({ values: [{ id: "ctx_1" }] }),
  );
  mockCreateCustomFieldContextOptions.mockResolvedValue(
    ok({ options: [] }),
  );

  // when
  await service.createCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition,
  });

  // then
  expect(mockCreateCustomFieldContextOptions).toHaveBeenCalledWith({
    params: { fieldId: "cf_1", contextId: "ctx_1" },
    body: { options: [{ value: "Open" }, { value: "Closed" }] },
  });
});

test("deleteCustomIssueField: given a project with no integration, when called, then returns badRequest err", async () => {
  // given

  // when
  const result = await service.deleteCustomIssueField({
    credential: basicCredential,
    project: { integration: null },
    fieldDefinition: fieldDefinitionWithIntegration,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr().code).toBe("badRequest");
});

test("deleteCustomIssueField: given a non-basic credential, when called, then returns badRequest err", async () => {
  // given

  // when
  const result = await service.deleteCustomIssueField({
    credential: { type: "oauth" as "basic", username: "", password: "" },
    project: projectWithIntegration,
    fieldDefinition: fieldDefinitionWithIntegration,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr().code).toBe("badRequest");
});

test("deleteCustomIssueField: given a fieldDefinition with no integration, when called, then returns badRequest err", async () => {
  // given

  // when
  const result = await service.deleteCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition: { name: "Test", integration: null },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr().code).toBe("badRequest");
});

test("deleteCustomIssueField: given valid inputs, when deleteField fails, then returns err", async () => {
  // given
  mockDeleteField.mockResolvedValue(err(Err.code("unknown")));

  // when
  const result = await service.deleteCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition: fieldDefinitionWithIntegration,
  });

  // then
  expect(result.isErr()).toBe(true);
});

test("deleteCustomIssueField: given valid inputs, when deleteField succeeds, then returns ok and calls deleteField with correct fieldId", async () => {
  // given
  mockDeleteField.mockResolvedValue(ok(undefined));

  // when
  const result = await service.deleteCustomIssueField({
    credential: basicCredential,
    project: projectWithIntegration,
    fieldDefinition: fieldDefinitionWithIntegration,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockDeleteField).toHaveBeenCalledWith({
    params: { fieldId: "customfield_10001" },
  });
});
