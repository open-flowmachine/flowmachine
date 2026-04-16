import type { Brand } from "@/domain/shared/id";

type WorkflowDefinitionId = Brand<string, "WorkflowDefinitionId">;
const WorkflowDefinitionId = (value: string): WorkflowDefinitionId =>
  value as WorkflowDefinitionId;

export { WorkflowDefinitionId };
