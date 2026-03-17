import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getProject } from "@/action/project/get-project";
import type { ProjectDomain } from "@/core/domain/project/entity";
import { makeGetProjectQueryKey } from "@/presentation/lib/query/query-key";

type UseGetProjectOptions = Omit<
  UseQueryOptions<ProjectDomain, Error, ProjectDomain>,
  "queryKey" | "queryFn"
>;

export const useGetProject = (id: string, options?: UseGetProjectOptions) => {
  return useQuery({
    queryKey: makeGetProjectQueryKey(id),
    queryFn: () => getProject(id),
    ...options,
  });
};
