import Elysia from "elysia";
import type { Inngest, InngestFunction } from "inngest";
import { serve } from "inngest/bun";
import type { DurableFunction } from "@/core/infra/durable-function/type";

class InngestHttpRouterFactory {
  #inngest: Inngest;
  #functions: InngestFunction.Any[];

  constructor(inngest: Inngest, functions: DurableFunction[]) {
    this.#inngest = inngest;
    this.#functions = functions as unknown as InngestFunction.Any[];
  }

  make() {
    return new Elysia({ name: InngestHttpRouterFactory.name }).all(
      "/api/inngest",
      ({ request }) =>
        serve({
          client: this.#inngest,
          functions: this.#functions,
        })(request),
    );
  }
}

export { InngestHttpRouterFactory };
