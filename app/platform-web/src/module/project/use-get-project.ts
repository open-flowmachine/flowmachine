import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeGetProjectQueryKey } from "@/lib/query/query-key";
import { makeProjectHttpClient } from "@/module/project/project-http-client";
import type { Project } from "@/module/project/project-type";

type UseGetProjectOptions = Omit<
  UseQueryOptions<HttpEnvelope<Project>, Error, Project>,
  "queryKey" | "queryFn"
>;

export const useGetProject = (id: string, options?: UseGetProjectOptions) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeGetProjectQueryKey(id),
    queryFn: () =>
      makeProjectHttpClient({ httpClient }).getById({
        params: { id },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
