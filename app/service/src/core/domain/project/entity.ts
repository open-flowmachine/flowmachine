import z from "zod";
import {
  type EntityId,
  entityIdSchema,
  newEntityId,
} from "@/core/domain/entity";
import { projectProviders } from "@/core/domain/project/provider";
import {
  type Tenant,
  TenantAwareEntity,
} from "@/core/domain/tenant-aware-entity";

const projectEntityProps = z.object({
  name: z.string().min(1).max(256),
  integration: z
    .object({
      domain: z.string().min(1).max(255),
      externalId: z.string().min(1).max(32),
      externalKey: z.string().min(1).max(32),
      provider: z.enum(projectProviders),
      webhookSecret: z.string().min(1).max(32),
      credentialId: entityIdSchema,
    })
    .optional(),
});
type ProjectEntityProps = z.output<typeof projectEntityProps>;

class ProjectEntity extends TenantAwareEntity<ProjectEntityProps> {
  static makeNew(tenant: Tenant, props: ProjectEntityProps) {
    return new ProjectEntity(newEntityId(), tenant, props);
  }

  static makeExisting(
    id: EntityId,
    createdAt: Date,
    updatedAt: Date,
    tenant: Tenant,
    props: ProjectEntityProps,
  ) {
    return new ProjectEntity(id, tenant, props, {
      createdAt,
      updatedAt,
    });
  }
}

export { ProjectEntity, projectEntityProps, type ProjectEntityProps };
