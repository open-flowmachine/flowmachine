import type { ProjectIssueFieldDefinitionEntityProps } from "@/core/domain/project/issue/field/definition/entity";
import type { TenantAwareMongoModel } from "@/infra/mongo/model";

type ProjectIssueFieldDefinitionMongoModel =
  TenantAwareMongoModel<ProjectIssueFieldDefinitionEntityProps>;

export type { ProjectIssueFieldDefinitionMongoModel };
