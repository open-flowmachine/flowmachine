import { format } from "date-fns";
import type { WorkflowDefinitionDomain } from "@/core/domain/workflow-definition/entity";

type MakeWorkflowDefinitionDomainServiceInput = {
  workflowDefinition: WorkflowDefinitionDomain;
};

export const makeWorkflowDefinitionDomainService = ({
  workflowDefinition,
}: MakeWorkflowDefinitionDomainServiceInput) => ({
  getCreatedAt: () =>
    format(workflowDefinition.createdAt, "MMM d, yyyy, h:mm a"),
  getUpdatedAt: () =>
    format(workflowDefinition.updatedAt, "MMM d, yyyy, h:mm a"),
  getStatusLabel: () => (workflowDefinition.isActive ? "Active" : "Inactive"),
});
