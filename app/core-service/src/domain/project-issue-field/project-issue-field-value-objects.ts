import type { ProjectProvider } from "@/domain/project/project-value-objects";

const issueFieldTypes = ["select"] as const;
type IssueFieldType = (typeof issueFieldTypes)[number];

type IssueFieldOption = {
  readonly value: string;
  readonly label: string;
};

type IssueFieldIntegration = {
  readonly externalId: string;
  readonly externalKey: string;
  readonly provider: ProjectProvider;
};

export { issueFieldTypes };
export type { IssueFieldIntegration, IssueFieldOption, IssueFieldType };
