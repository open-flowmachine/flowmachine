const makeListPromptsQueryKey = () => ["prompt"];

const makeListAiAgentsQueryKey = () => ["ai-agent"];

const makeGetAiAgentQueryKey = (id: string) => ["ai-agent", id];

const makeListAiAgentRunsQueryKey = (aiAgentId: string) => [
  "ai-agent",
  aiAgentId,
  "run",
];

const makeGetAiAgentRunQueryKey = (aiAgentId: string, runId: string) => [
  "ai-agent",
  aiAgentId,
  "run",
  runId,
];

const makeListAiAgentRunMessagesQueryKey = (
  aiAgentId: string,
  runId: string,
) => ["ai-agent", aiAgentId, "run", runId, "message"];

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
  makeListAiAgentRunsQueryKey,
  makeGetAiAgentRunQueryKey,
  makeListAiAgentRunMessagesQueryKey,
  makeListWorkflowDefinitionsQueryKey,
  makeGetWorkflowDefinitionQueryKey,
  makeListProjectsQueryKey,
  makeGetProjectQueryKey,
  makeListGitRepositoriesQueryKey,
  makeGetGitRepositoryQueryKey,
  makeListCredentialsQueryKey,
  makeGetCredentialQueryKey,
};
