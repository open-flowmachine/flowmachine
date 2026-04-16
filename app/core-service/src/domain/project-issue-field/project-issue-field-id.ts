import type { Brand } from "@/domain/shared/id";

type ProjectIssueFieldDefinitionId = Brand<
  string,
  "ProjectIssueFieldDefinitionId"
>;
const ProjectIssueFieldDefinitionId = (
  value: string,
): ProjectIssueFieldDefinitionId =>
  value as ProjectIssueFieldDefinitionId;

export { ProjectIssueFieldDefinitionId };
