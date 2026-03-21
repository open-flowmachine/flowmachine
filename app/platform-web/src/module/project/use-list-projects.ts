import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeListProjectsQueryKey } from "@/lib/query/query-key";
import { makeProjectHttpClient } from "@/module/project/project-http-client";
import type { Project } from "@/module/project/project-type";

type UseListProjectsOptions = Omit<
  UseQueryOptions<HttpEnvelope<Project[]>, Error, Project[]>,
  "queryKey" | "queryFn"
>;

export const useListProjects = (options?: UseListProjectsOptions) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListProjectsQueryKey(),
    queryFn: () => makeProjectHttpClient({ httpClient }).list(),
    select: (envelope) => envelope.data,
    ...options,
  });
};
