import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type EditAiAgentFormValues,
  editAiAgentFormValuesSchema,
} from "@/presentation/feature/editable-ai-agent-details/edit-ai-agent-form-schema";

export const useEditAiAgentForm = (
  props?: UseFormProps<EditAiAgentFormValues>,
) => {
  return useForm<EditAiAgentFormValues>({
    resolver: standardSchemaResolver(editAiAgentFormValuesSchema),
    ...props,
  });
};
