import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { listCredentials } from "@/action/credential/list-credentials";
import type { CredentialDomain } from "@/core/domain/credential/entity";
import { makeListCredentialsQueryKey } from "@/presentation/lib/query/query-key";

type UseListCredentialsOptions = Omit<
  UseQueryOptions<CredentialDomain[], Error, CredentialDomain[]>,
  "queryKey" | "queryFn"
>;

export const useListCredentials = (options?: UseListCredentialsOptions) => {
  return useQuery({
    queryKey: makeListCredentialsQueryKey(),
    queryFn: () => listCredentials(),
    ...options,
  });
};
