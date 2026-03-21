import { format } from "date-fns";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

const makeWorkflowDefinitionService = (input: {
  workflowDefinition: WorkflowDefinition;
}) => {
  const { workflowDefinition } = input;
  return {
    getCreatedAt: () =>
      format(workflowDefinition.createdAt, "MMM d, yyyy, h:mm a"),
    getUpdatedAt: () =>
      format(workflowDefinition.updatedAt, "MMM d, yyyy, h:mm a"),
    getStatusLabel: () =>
      workflowDefinition.isActive ? "Active" : "Inactive",
  };
};

export { makeWorkflowDefinitionService };
