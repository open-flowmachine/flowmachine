import type { Inngest } from "inngest";
import type z from "zod";
import type { DurableFunctionContext } from "@/core/infra/durable-function/context";
import type {
  DurableFunctionFactory,
  durableFunctionFactoryInputSchema,
} from "@/core/infra/durable-function/factory";
import type { DurableFunction } from "@/core/infra/durable-function/type";

export class InngestFunctionFactory implements DurableFunctionFactory {
  #inngest: Inngest;

  constructor(inngest: Inngest) {
    this.#inngest = inngest;
  }

  make(
    input: z.infer<typeof durableFunctionFactoryInputSchema.make>,
  ): DurableFunction {
    const fn = this.#inngest.createFunction(
      input.config,
      input.trigger,
      async ({ event, step }) =>
        input.handler({
          event,
          step,
        } as unknown as DurableFunctionContext),
    );
    return fn as unknown as DurableFunction;
  }
}
