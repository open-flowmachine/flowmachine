import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { listWorkflowDefinitions } from "@/action/workflow-definition/list-workflow-definitions";
import type { WorkflowDefinitionDomain } from "@/core/domain/workflow-definition/entity";
import { makeListWorkflowDefinitionsQueryKey } from "@/presentation/lib/query/query-key";

type UseListWorkflowDefinitionsOptions = Omit<
  UseQueryOptions<
    WorkflowDefinitionDomain[],
    Error,
    WorkflowDefinitionDomain[]
  >,
  "queryKey" | "queryFn"
>;

export const useListWorkflowDefinitions = (
  options?: UseListWorkflowDefinitionsOptions,
) => {
  return useQuery({
    queryKey: makeListWorkflowDefinitionsQueryKey(),
    queryFn: () => listWorkflowDefinitions(),
    ...options,
  });
};
