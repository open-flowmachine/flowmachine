import type { Result } from "neverthrow";
import z from "zod";
import { tenantCtxSchema } from "@/common/ctx/tenant-ctx";
import type { Err } from "@/common/err/err";
import { CredentialEntity } from "@/core/domain/credential/entity";
import { ProjectEntity } from "@/core/domain/project/entity";
import { ProjectIssueFieldDefinitionEntity } from "@/core/domain/project/issue/field/definition/entity";

const externalProjectServiceInputSchema = {
  createIssueField: z.object({
    ctx: tenantCtxSchema,
    credential: z.instanceof(CredentialEntity),
    project: z.instanceof(ProjectEntity),
    projectIssueFieldDefinition: z.instanceof(
      ProjectIssueFieldDefinitionEntity,
    ),
  }),
  deleteIssueField: z.object({
    ctx: tenantCtxSchema,
    credential: z.instanceof(CredentialEntity),
    project: z.instanceof(ProjectEntity),
    projectIssueFieldDefinition: z.instanceof(
      ProjectIssueFieldDefinitionEntity,
    ),
  }),
};

interface ExternalProjectService {
  createCustomIssueField(
    input: z.infer<typeof externalProjectServiceInputSchema.createIssueField>,
  ): Promise<Result<{ externalId: string; externalKey: string }, Err>>;
  deleteCustomIssueField(
    input: z.infer<typeof externalProjectServiceInputSchema.deleteIssueField>,
  ): Promise<Result<void, Err>>;
}

export { type ExternalProjectService, externalProjectServiceInputSchema };
