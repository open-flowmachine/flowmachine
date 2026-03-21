const makeListPromptsQueryKey = () => ["prompt"];

const makeListAiAgentsQueryKey = () => ["ai-agent"];

const makeGetAiAgentQueryKey = (id: string) => ["ai-agent", id];

const makeListWorkflowDefinitionsQueryKey = () => ["workflow-definition"];

const makeGetWorkflowDefinitionQueryKey = (id: string) => [
  "workflow-definition",
  id,
];

const makeListProjectsQueryKey = () => ["project"];

const makeGetProjectQueryKey = (id: string) => ["project", id];

const makeListGitRepositoriesQueryKey = () => ["git-repository"];

const makeGetGitRepositoryQueryKey = (id: string) => ["git-repository", id];

const makeListCredentialsQueryKey = () => ["credential"];

const makeGetCredentialQueryKey = (id: string) => ["credential", id];

export {
  makeListPromptsQueryKey,
  makeListAiAgentsQueryKey,
  makeGetAiAgentQueryKey,
  makeListWorkflowDefinitionsQueryKey,
  makeGetWorkflowDefinitionQueryKey,
  makeListProjectsQueryKey,
  makeGetProjectQueryKey,
  makeListGitRepositoriesQueryKey,
  makeGetGitRepositoryQueryKey,
  makeListCredentialsQueryKey,
  makeGetCredentialQueryKey,
};
