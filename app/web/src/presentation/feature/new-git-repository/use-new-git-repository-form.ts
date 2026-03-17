import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";
import {
  type NewGitRepositoryFormValues,
  newGitRepositoryFormValuesSchema,
} from "@/presentation/feature/new-git-repository/new-git-repository-form-schema";

export const useNewGitRepositoryForm = (
  props?: UseFormProps<NewGitRepositoryFormValues>,
) => {
  return useForm<NewGitRepositoryFormValues>({
    defaultValues: {
      name: "",
      url: "",
      config: {
        defaultBranch: "main",
        email: "",
        username: "",
      },
      integration: {
        provider: "github",
        credentialId: "",
      },
      projects: [],
    },
    resolver: standardSchemaResolver(newGitRepositoryFormValuesSchema),
    ...props,
  });
};
