import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeGetWorkflowDefinitionQueryKey } from "@/lib/query/query-key";
import { makeWorkflowDefinitionHttpClient } from "@/module/workflow/workflow-definition-http-client";

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
