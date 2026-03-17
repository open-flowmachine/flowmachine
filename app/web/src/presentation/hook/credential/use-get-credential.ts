import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getCredential } from "@/action/credential/get-credential";
import type { CredentialDomain } from "@/core/domain/credential/entity";
import { makeGetCredentialQueryKey } from "@/presentation/lib/query/query-key";

type UseGetCredentialOptions = Omit<
  UseQueryOptions<CredentialDomain, Error, CredentialDomain>,
  "queryKey" | "queryFn"
>;

export const useGetCredential = (
  id: string,
  options?: UseGetCredentialOptions,
) => {
  return useQuery({
    queryKey: makeGetCredentialQueryKey(id),
    queryFn: () => getCredential(id),
    ...options,
  });
};
