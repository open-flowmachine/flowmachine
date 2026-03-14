import z from "zod";
import {
  type EntityId,
  entityIdSchema,
  newEntityId,
} from "@/core/domain/entity";
import { projectIssueFieldTypes } from "@/core/domain/project/issue/field/type";
import { projectProviders } from "@/core/domain/project/provider";
import {
  type Tenant,
  TenantAwareEntity,
} from "@/core/domain/tenant-aware-entity";

const projectIssueFieldDefinitionEntityProps = z.object({
  name: z.string().min(1).max(256),
  type: z.enum(projectIssueFieldTypes),
  options: z
    .object({
      value: z.string().min(1).max(256),
      label: z.string().min(1).max(256),
    })
    .array(),

  integration: z
    .object({
      externalId: z.string().min(1).max(32),
      externalKey: z.string().min(1).max(32),
      provider: z.enum(projectProviders),
    })
    .optional(),
  project: z.object({
    id: entityIdSchema,
  }),
});
type ProjectIssueFieldDefinitionEntityProps = z.output<
  typeof projectIssueFieldDefinitionEntityProps
>;

class ProjectIssueFieldDefinitionEntity extends TenantAwareEntity<ProjectIssueFieldDefinitionEntityProps> {
  static makeNew(
    tenant: Tenant,
    props: ProjectIssueFieldDefinitionEntityProps,
  ) {
    return new ProjectIssueFieldDefinitionEntity(newEntityId(), tenant, props);
  }

  static makeExisting(
    id: EntityId,
    createdAt: Date,
    updatedAt: Date,
    tenant: Tenant,
    props: ProjectIssueFieldDefinitionEntityProps,
  ) {
    return new ProjectIssueFieldDefinitionEntity(id, tenant, props, {
      createdAt,
      updatedAt,
    });
  }
}

export {
  ProjectIssueFieldDefinitionEntity,
  projectIssueFieldDefinitionEntityProps,
  type ProjectIssueFieldDefinitionEntityProps,
};
