import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";

import {
  type EditWorkflowDefinitionFormValues,
  editWorkflowDefinitionFormValuesSchema,
} from "@/feature/editable-workflow-definition-details/edit-workflow-definition-form-schema";

export const useEditWorkflowDefinitionForm = (
  props?: UseFormProps<EditWorkflowDefinitionFormValues>,
) => {
  return useForm<EditWorkflowDefinitionFormValues>({
    resolver: standardSchemaResolver(editWorkflowDefinitionFormValuesSchema),
    ...props,
  });
};
