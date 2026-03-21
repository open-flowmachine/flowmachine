import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProtectedHttpClient } from "@/hook/use-protected-http-client";
import { makeListCredentialsQueryKey } from "@/lib/query/query-key";
import { makeCredentialHttpClient } from "@/module/credential/credential-http-client";
import type { HttpClientUpdateCredentialInput } from "@/module/credential/credential-type";

type UseUpdateCredentialOptions = Omit<
  UseMutationOptions<void, Error, HttpClientUpdateCredentialInput, unknown>,
  "mutationFn"
>;

export const useUpdateCredential = (options?: UseUpdateCredentialOptions) => {
  const httpClient = useProtectedHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HttpClientUpdateCredentialInput) => {
      await makeCredentialHttpClient({ httpClient }).updateById(input);
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
