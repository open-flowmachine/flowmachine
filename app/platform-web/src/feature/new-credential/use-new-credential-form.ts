import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type NewCredentialFormValues,
  newCredentialFormValuesSchema,
} from "@/feature/new-credential/new-credential-form-schema";

export const useNewCredentialForm = (
  props?: UseFormProps<NewCredentialFormValues>,
) => {
  return useForm<NewCredentialFormValues>({
    defaultValues: {
      type: "apiKey",
      name: "",
      apiKey: "",
      expiredAt: "",
    },
    resolver: standardSchemaResolver(newCredentialFormValuesSchema),
    ...props,
  });
};
