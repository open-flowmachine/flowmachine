import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UseFormProps, useForm } from "react-hook-form";

import {
  type NewWorkflowDefinitionFormValues,
  newWorkflowDefinitionFormValuesSchema,
} from "@/feature/new-workflow-definition/new-workflow-definition-form-schema";

const DEFAULT_ACTIONS_JSON = JSON.stringify(
  [
    {
      id: "00000000-0000-0000-0000-000000000001",
      kind: "start",
      name: "Start Action",
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      kind: "end",
      name: "End Action",
    },
  ],
  null,
  4,
);

const DEFAULT_EDGES_JSON = JSON.stringify(
  [
    {
      from: "00000000-0000-0000-0000-000000000001",
      to: "00000000-0000-0000-0000-000000000002",
    },
  ],
  null,
  4,
);

export const useNewWorkflowDefinitionForm = (
  props?: UseFormProps<NewWorkflowDefinitionFormValues>,
) => {
  return useForm<NewWorkflowDefinitionFormValues>({
    defaultValues: {
      name: "",
      description: "",
      projects: [],
      isActive: true,
      actionsJson: DEFAULT_ACTIONS_JSON,
      edgesJson: DEFAULT_EDGES_JSON,
    },
    resolver: standardSchemaResolver(newWorkflowDefinitionFormValuesSchema),
    ...props,
  });
};
