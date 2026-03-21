import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import { makeTenantAwareMongoRepository } from "@/vendor/mongo/mongo-repository";

const projectIssueFieldDefinitionRepository =
  makeTenantAwareMongoRepository<ProjectIssueFieldDefinition>({
    collectionName: "project-issue-field-definition",
  });

export { projectIssueFieldDefinitionRepository };
