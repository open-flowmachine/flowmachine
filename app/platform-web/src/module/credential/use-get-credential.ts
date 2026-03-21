import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeGetCredentialQueryKey } from "@/lib/query/query-key";
import { makeCredentialHttpClient } from "@/module/credential/credential-http-client";
import type { Credential } from "@/module/credential/credential-type";

type UseGetCredentialOptions = Omit<
  UseQueryOptions<HttpEnvelope<Credential>, Error, Credential>,
  "queryKey" | "queryFn"
>;

export const useGetCredential = (
  id: string,
  options?: UseGetCredentialOptions,
) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeGetCredentialQueryKey(id),
    queryFn: () =>
      makeCredentialHttpClient({ httpClient }).getById({
        params: { id },
      }),
    select: (envelope) => envelope.data,
    ...options,
  });
};
