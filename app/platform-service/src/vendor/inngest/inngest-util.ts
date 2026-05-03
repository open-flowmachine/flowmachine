import type { EventPayload, GetStepTools, Inngest } from "inngest";
import type z from "zod";

import { validate } from "@/shared/schema/schema-validation";
import { baseLog } from "@/vendor/pino/pino-log";

type InngestFnInput<T = unknown> = {
  event: Omit<EventPayload<T>, "data"> & { data: T };
  step: GetStepTools<Inngest>;
};

type MakeInngestFnInput<T, K> = {
  dataSchema: z.ZodType<T>;
  handler: (input: InngestFnInput<T>) => Promise<K>;
};

const log = baseLog.child({ context: "inngest-step-fn" });

const makeInngestFnHandler =
  <T, K>(input1: MakeInngestFnInput<T, K>) =>
  async (input2: InngestFnInput) => {
    const { dataSchema, handler } = input1;
    const { event, step } = input2;

    const dataValidationResult = validate(dataSchema, event.data);

    if (dataValidationResult.isErr()) {
      log.error({ error: dataValidationResult.error }, "invalid event data");
      return;
    }
    return await handler({
      event: { ...event, data: dataValidationResult.value },
      step,
    });
  };

const makeInngestEventType = <T extends string, K>(input: {
  name: T;
  dataSchema: z.ZodType<K>;
}) => {
  const { dataSchema, name } = input;

  return {
    make: (input: { data: K }) => ({
      name,
      data: input.data,
    }),
    dataSchema: () => dataSchema,
    name: () => name,
  };
};

export { makeInngestEventType, makeInngestFnHandler };
