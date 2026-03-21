import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import { makeListCredentialsQueryKey } from "@/lib/query/query-key";
import { makeCredentialHttpClient } from "@/module/credential/credential-http-client";
import type { Credential } from "@/module/credential/credential-type";

type UseListCredentialsOptions = Omit<
  UseQueryOptions<HttpEnvelope<Credential[]>, Error, Credential[]>,
  "queryKey" | "queryFn"
>;

export const useListCredentials = (options?: UseListCredentialsOptions) => {
  const httpClient = useProtectedHttpClient();

  return useQuery({
    queryKey: makeListCredentialsQueryKey(),
    queryFn: () => makeCredentialHttpClient({ httpClient }).list(),
    select: (envelope) => envelope.data,
    ...options,
  });
};
