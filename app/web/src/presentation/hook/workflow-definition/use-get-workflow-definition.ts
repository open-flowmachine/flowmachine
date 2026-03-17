import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getWorkflowDefinition } from "@/action/workflow-definition/get-workflow-definition";
import type { WorkflowDefinitionDomain } from "@/core/domain/workflow-definition/entity";
import { makeGetWorkflowDefinitionQueryKey } from "@/presentation/lib/query/query-key";

type UseGetWorkflowDefinitionOptions = Omit<
  UseQueryOptions<WorkflowDefinitionDomain, Error, WorkflowDefinitionDomain>,
  "queryKey" | "queryFn"
>;

export const useGetWorkflowDefinition = (
  id: string,
  options?: UseGetWorkflowDefinitionOptions,
) => {
  return useQuery({
    queryKey: makeGetWorkflowDefinitionQueryKey(id),
    queryFn: () => getWorkflowDefinition(id),
    ...options,
  });
};
