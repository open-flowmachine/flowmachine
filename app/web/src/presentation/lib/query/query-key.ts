export const makeListPromptsQueryKey = () => ["prompt"];

export const makeListAiAgentsQueryKey = () => ["ai-agent"];

export const makeGetAiAgentQueryKey = (id: string) => ["ai-agent", id];

export const makeListWorkflowDefinitionsQueryKey = () => [
  "workflow-definition",
];

export const makeGetWorkflowDefinitionQueryKey = (id: string) => [
  "workflow-definition",
  id,
];

export const makeListProjectsQueryKey = () => ["project"];

export const makeGetProjectQueryKey = (id: string) => ["project", id];

export const makeListGitRepositoriesQueryKey = () => ["git-repository"];

export const makeGetGitRepositoryQueryKey = (id: string) => [
  "git-repository",
  id,
];

export const makeListCredentialsQueryKey = () => ["credential"];

export const makeGetCredentialQueryKey = (id: string) => ["credential", id];
