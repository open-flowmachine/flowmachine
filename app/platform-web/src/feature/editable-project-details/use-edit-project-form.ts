import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type EditProjectFormValues,
  editProjectFormValuesSchema,
} from "@/feature/editable-project-details/edit-project-form-schema";

export const useEditProjectForm = (
  props?: UseFormProps<EditProjectFormValues>,
) => {
  return useForm<EditProjectFormValues>({
    resolver: standardSchemaResolver(editProjectFormValuesSchema),
    ...props,
  });
};
