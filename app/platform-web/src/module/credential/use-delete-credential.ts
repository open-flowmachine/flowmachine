import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import {
  makeGetCredentialQueryKey,
  makeListCredentialsQueryKey,
} from "@/lib/query/query-key";
import { makeCredentialHttpClient } from "@/module/credential/credential-http-client";
import type { HttpClientDeleteCredentialInput } from "@/module/credential/credential-type";

type UseDeleteCredentialOptions = Omit<
  UseMutationOptions<void, Error, HttpClientDeleteCredentialInput, unknown>,
  "mutationFn"
>;

export const useDeleteCredential = (options?: UseDeleteCredentialOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientDeleteCredentialInput) => {
      await makeCredentialHttpClient({ httpClient }).deleteById(input);
    },
    ...options,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({
        queryKey: makeListCredentialsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: makeGetCredentialQueryKey(variables.params.id),
      });
      options?.onSuccess?.(...args);
    },
  });
};
