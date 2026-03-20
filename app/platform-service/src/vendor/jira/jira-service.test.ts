import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import { Err } from "@/shared/err/err";

// --- Mock setup ---

const mockCreateCustomField = mock();
const mockCreateCustomFieldContextOptions = mock();
const mockCreateCustomFieldAssociations = mock();
const mockGetCustomFieldContexts = mock();
const mockDeleteField = mock();

mock.module("@/vendor/jira/jira-client", () => ({
  makeJiraClient: () => ({
    createCustomField: mockCreateCustomField,
    createCustomFieldContextOptions: mockCreateCustomFieldContextOptions,
    createCustomFieldAssociations: mockCreateCustomFieldAssociations,
    getCustomFieldContexts: mockGetCustomFieldContexts,
    deleteField: mockDeleteField,
  }),
}));

// Import after mocking
const { makeJiraService } = await import("./jira-service");

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
  mockCreateCustomField.mockClear();
  mockCreateCustomFieldContextOptions.mockClear();
  mockCreateCustomFieldAssociations.mockClear();
  mockGetCustomFieldContexts.mockClear();
  mockDeleteField.mockClear();
};

// --- Tests ---

describe("makeJiraService", () => {
  const service = makeJiraService();

  beforeEach(resetMocks);

  describe("createCustomIssueField", () => {
    it("should return err when project has no integration", async () => {
      const result = await service.createCustomIssueField({
        credential: basicCredential,
        project: { integration: null },
        fieldDefinition,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
      expect(result._unsafeUnwrapErr().code).toBe("badRequest");
    });

    it("should return err when credential type is not basic", async () => {
      const result = await service.createCustomIssueField({
        credential: { type: "oauth" as "basic", username: "", password: "" },
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("badRequest");
    });

    it("should return err when createCustomField fails", async () => {
      mockCreateCustomField.mockResolvedValue(err(Err.code("unknown")));

      const result = await service.createCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return err when createCustomFieldAssociations fails", async () => {
      mockCreateCustomField.mockResolvedValue(
        ok({ id: "cf_1", key: "cf_1", name: "Test", custom: true }),
      );
      mockCreateCustomFieldAssociations.mockResolvedValue(
        err(Err.code("unknown")),
      );

      const result = await service.createCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return err when getCustomFieldContexts fails", async () => {
      mockCreateCustomField.mockResolvedValue(
        ok({ id: "cf_1", key: "cf_1", name: "Test", custom: true }),
      );
      mockCreateCustomFieldAssociations.mockResolvedValue(ok(undefined));
      mockGetCustomFieldContexts.mockResolvedValue(err(Err.code("unknown")));

      const result = await service.createCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return err when no context is found", async () => {
      mockCreateCustomField.mockResolvedValue(
        ok({ id: "cf_1", key: "cf_1", name: "Test", custom: true }),
      );
      mockCreateCustomFieldAssociations.mockResolvedValue(ok(undefined));
      mockGetCustomFieldContexts.mockResolvedValue(ok({ values: [] }));

      const result = await service.createCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("notFound");
    });

    it("should return ok with externalId and externalKey on success", async () => {
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

      const result = await service.createCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        externalId: "cf_1",
        externalKey: "customfield_10001",
      });
    });

    it("should pass field options to createCustomFieldContextOptions", async () => {
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

      await service.createCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition,
      });

      expect(mockCreateCustomFieldContextOptions).toHaveBeenCalledWith({
        params: { fieldId: "cf_1", contextId: "ctx_1" },
        body: { options: [{ value: "Open" }, { value: "Closed" }] },
      });
    });
  });

  describe("deleteCustomIssueField", () => {
    it("should return err when project has no integration", async () => {
      const result = await service.deleteCustomIssueField({
        credential: basicCredential,
        project: { integration: null },
        fieldDefinition: fieldDefinitionWithIntegration,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("badRequest");
    });

    it("should return err when credential type is not basic", async () => {
      const result = await service.deleteCustomIssueField({
        credential: { type: "oauth" as "basic", username: "", password: "" },
        project: projectWithIntegration,
        fieldDefinition: fieldDefinitionWithIntegration,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("badRequest");
    });

    it("should return err when fieldDefinition has no integration", async () => {
      const result = await service.deleteCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition: { name: "Test", integration: null },
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("badRequest");
    });

    it("should return err when deleteField fails", async () => {
      mockDeleteField.mockResolvedValue(err(Err.code("unknown")));

      const result = await service.deleteCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition: fieldDefinitionWithIntegration,
      });

      expect(result.isErr()).toBe(true);
    });

    it("should return ok on successful deletion", async () => {
      mockDeleteField.mockResolvedValue(ok(undefined));

      const result = await service.deleteCustomIssueField({
        credential: basicCredential,
        project: projectWithIntegration,
        fieldDefinition: fieldDefinitionWithIntegration,
      });

      expect(result.isOk()).toBe(true);
      expect(mockDeleteField).toHaveBeenCalledWith({
        params: { fieldId: "customfield_10001" },
      });
    });
  });
});
