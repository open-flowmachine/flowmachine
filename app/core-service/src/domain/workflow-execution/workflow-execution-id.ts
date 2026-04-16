import type { Brand } from "@/domain/shared/id";

type WorkflowExecutionId = Brand<string, "WorkflowExecutionId">;
const WorkflowExecutionId = (value: string): WorkflowExecutionId =>
  value as WorkflowExecutionId;

export { WorkflowExecutionId };
