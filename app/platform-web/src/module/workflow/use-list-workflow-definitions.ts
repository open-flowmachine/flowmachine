import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeListWorkflowDefinitionsQueryKey } from "@/lib/query/query-key";
import { makeWorkflowDefinitionHttpClient } from "@/module/workflow/workflow-definition-http-client";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

type UseListWorkflowDefinitionsOptions = Omit<
  UseQueryOptions<
    HttpEnvelope<WorkflowDefinition[]>,
    Error,
    WorkflowDefinition[]
  >,
  "queryKey" | "queryFn"
>;

export const useListWorkflowDefinitions = (
  options?: UseListWorkflowDefinitionsOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListWorkflowDefinitionsQueryKey(),
    queryFn: () => makeWorkflowDefinitionHttpClient({ httpClient }).list(),
    select: (envelope) => envelope.data,
    ...options,
  });
};
