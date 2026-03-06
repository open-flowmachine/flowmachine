import z from "zod";
import type { DurableFunctionContext } from "@/core/infra/durable-function/context";
import type { DurableFunction } from "@/core/infra/durable-function/type";

const durableFunctionFactoryInputSchema = {
  make: z.object({
    config: z.object({
      id: z.string(),
    }),
    trigger: z.object({
      event: z.string(),
    }),
    handler: z.custom<(ctx: DurableFunctionContext) => Promise<unknown>>(),
  }),
};

interface DurableFunctionFactory {
  make(
    input: z.infer<typeof durableFunctionFactoryInputSchema.make>,
  ): DurableFunction;
}

export { type DurableFunctionFactory, durableFunctionFactoryInputSchema };
