import type { ProjectProvider } from "@/module/project/project-model";
import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const projectIssueFieldDefinitionTypes = ["select"] as const;
type ProjectIssueFieldDefinitionType =
  (typeof projectIssueFieldDefinitionTypes)[number];

type ProjectIssueFieldDefinition = Model<{
  name: string;
  type: ProjectIssueFieldDefinitionType;
  options: { value: string; label: string }[];
  integration: {
    externalId: string;
    externalKey: string;
    provider: ProjectProvider;
  } | null;
  project: { id: Id };
}>;

export { projectIssueFieldDefinitionTypes };
export type { ProjectIssueFieldDefinition, ProjectIssueFieldDefinitionType };
