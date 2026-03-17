import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateCredential } from "@/action/credential/update-credential";
import type { UpdateCredentialServicePortIn } from "@/core/port/credential/service-port";
import { makeListCredentialsQueryKey } from "@/presentation/lib/query/query-key";

type UseUpdateCredentialOptions = Omit<
  UseMutationOptions<void, Error, UpdateCredentialServicePortIn, unknown>,
  "mutationFn"
>;

export const useUpdateCredential = (options?: UseUpdateCredentialOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCredentialServicePortIn) => {
      await updateCredential(input);
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
