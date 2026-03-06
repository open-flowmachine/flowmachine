import type { DurableFunctionContext } from "@/core/infra/durable-function/context";

interface WorkflowEngine {
  run(ctx: DurableFunctionContext): Promise<void>;
}

export type { WorkflowEngine };
