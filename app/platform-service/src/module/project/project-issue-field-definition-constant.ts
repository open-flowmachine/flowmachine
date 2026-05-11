const projectIssueFieldDefinitionNames = {
  aiAgent: "AI Agent",
  gitRepository: "Git Repository",
  workflowDefinition: "Workflow Definition",
} as const;

type ProjectIssueFieldDefinitionEntityType =
  keyof typeof projectIssueFieldDefinitionNames;

export { projectIssueFieldDefinitionNames };
export type { ProjectIssueFieldDefinitionEntityType };
