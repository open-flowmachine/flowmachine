import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeGetWorkflowDefinitionQueryKey } from "@/lib/query/query-key";
import { makeWorkflowDefinitionHttpClient } from "@/module/workflow/workflow-definition-http-client";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

type UseGetWorkflowDefinitionOptions = Omit<
  UseQueryOptions<HttpEnvelope<WorkflowDefinition>, Error>,
  "queryKey" | "queryFn"
>;

export const useGetWorkflowDefinition = (
  id: string,
  options?: UseGetWorkflowDefinitionOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeGetWorkflowDefinitionQueryKey(id),
    queryFn: () =>
      makeWorkflowDefinitionHttpClient({ httpClient }).getById({
        params: { id },
      }),
    ...options,
  });
};
