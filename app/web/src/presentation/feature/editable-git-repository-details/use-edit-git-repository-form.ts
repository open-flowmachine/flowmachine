import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type EditGitRepositoryFormValues,
  editGitRepositoryFormValuesSchema,
} from "@/presentation/feature/editable-git-repository-details/edit-git-repository-form-schema";

export const useEditGitRepositoryForm = (
  props?: UseFormProps<EditGitRepositoryFormValues>,
) => {
  return useForm<EditGitRepositoryFormValues>({
    resolver: standardSchemaResolver(editGitRepositoryFormValuesSchema),
    ...props,
  });
};
