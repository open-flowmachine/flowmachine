import type { Inngest, InngestFunction } from "inngest";

class InngestFunctionFactory {
  #inngest: Inngest;

  constructor(inngest: Inngest) {
    this.#inngest = inngest;
  }

  make(input: {
    config: { id: string };
    trigger: { event: string };
    handler: Parameters<Inngest["createFunction"]>[2];
  }): InngestFunction.Any {
    return this.#inngest.createFunction(
      input.config,
      input.trigger,
      input.handler,
    );
  }
}

export { InngestFunctionFactory };
