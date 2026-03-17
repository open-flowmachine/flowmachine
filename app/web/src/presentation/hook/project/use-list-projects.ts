import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { listProjects } from "@/action/project/list-projects";
import type { ProjectDomain } from "@/core/domain/project/entity";
import { makeListProjectsQueryKey } from "@/presentation/lib/query/query-key";

type UseListProjectsOptions = Omit<
  UseQueryOptions<ProjectDomain[], Error, ProjectDomain[]>,
  "queryKey" | "queryFn"
>;

export const useListProjects = (options?: UseListProjectsOptions) => {
  return useQuery({
    queryKey: makeListProjectsQueryKey(),
    queryFn: () => listProjects(),
    ...options,
  });
};
