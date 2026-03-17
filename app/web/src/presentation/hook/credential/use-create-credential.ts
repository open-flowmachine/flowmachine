import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createCredential } from "@/action/credential/create-credential";
import type { CreateCredentialServicePortIn } from "@/core/port/credential/service-port";
import { makeListCredentialsQueryKey } from "@/presentation/lib/query/query-key";

type UseCreateCredentialOptions = Omit<
  UseMutationOptions<void, Error, CreateCredentialServicePortIn, unknown>,
  "mutationFn"
>;

export const useCreateCredential = (options?: UseCreateCredentialOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCredentialServicePortIn) => {
      await createCredential(input.body);
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
