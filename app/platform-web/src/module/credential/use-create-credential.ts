import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListCredentialsQueryKey } from "@/lib/query/query-key";
import { makeCredentialHttpClient } from "@/module/credential/credential-http-client";
import type { HttpClientCreateCredentialInput } from "@/module/credential/credential-type";

type UseCreateCredentialOptions = Omit<
  UseMutationOptions<void, Error, HttpClientCreateCredentialInput, unknown>,
  "mutationFn"
>;

export const useCreateCredential = (options?: UseCreateCredentialOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientCreateCredentialInput) => {
      await makeCredentialHttpClient({ httpClient }).create(input);
    },
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: makeListCredentialsQueryKey(),
      });
      options?.onSuccess?.(...args);
    },
  });
};
