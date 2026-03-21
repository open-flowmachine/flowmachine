import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type NewAiAgentFormValues,
  newAiAgentFormValuesSchema,
} from "@/feature/new-ai-agent/new-ai-agent-form-schema";

export const useNewAiAgentForm = (
  props?: UseFormProps<NewAiAgentFormValues>,
) => {
  return useForm<NewAiAgentFormValues>({
    defaultValues: {
      name: "",
      model: "anthropic/claude-opus-4.6",
      projects: [],
    },
    resolver: standardSchemaResolver(newAiAgentFormValuesSchema),
    ...props,
  });
};
