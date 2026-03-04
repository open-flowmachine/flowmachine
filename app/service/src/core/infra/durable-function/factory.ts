import type { Handler, Inngest } from "inngest";
import z from "zod";
import type { DurableFunction } from "@/core/infra/durable-function/type";

const durableFunctionFactoryInputSchema = {
  make: z.object({
    config: z.object({
      id: z.string(),
    }),
    trigger: z.object({
      event: z.string(),
    }),
    handler: z.custom<Handler<Inngest.Any>>(),
  }),
};

interface DurableFunctionFactory {
  make(
    input: z.infer<typeof durableFunctionFactoryInputSchema.make>,
  ): DurableFunction;
}

export { type DurableFunctionFactory, durableFunctionFactoryInputSchema };
