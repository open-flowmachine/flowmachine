import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type EditCredentialFormValues,
  editCredentialFormValuesSchema,
} from "@/presentation/feature/editable-credential-details/edit-credential-form-schema";

export const useEditCredentialForm = (
  props?: UseFormProps<EditCredentialFormValues>,
) => {
  return useForm<EditCredentialFormValues>({
    resolver: standardSchemaResolver(editCredentialFormValuesSchema),
    ...props,
  });
};
