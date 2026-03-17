import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteCredential } from "@/action/credential/delete-credential";
import type { DeleteCredentialServicePortIn } from "@/core/port/credential/service-port";
import {
  makeGetCredentialQueryKey,
  makeListCredentialsQueryKey,
} from "@/presentation/lib/query/query-key";

type UseDeleteCredentialOptions = Omit<
  UseMutationOptions<void, Error, DeleteCredentialServicePortIn, unknown>,
  "mutationFn"
>;

export const useDeleteCredential = (options?: UseDeleteCredentialOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteCredentialServicePortIn) => {
      await deleteCredential(input.params.id);
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
