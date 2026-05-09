import type { EventPayload, GetStepTools, Inngest } from "inngest";
import type z from "zod";

type InngestFnInput<T = unknown> = {
  event: Omit<EventPayload<T>, "data"> & { data: T };
  step: GetStepTools<Inngest>;
};

type MakeInngestFnInput<T, K> = {
  dataSchema: z.ZodType<T>;
  handler: (input: InngestFnInput<T>) => Promise<K>;
};

export type { InngestFnInput, MakeInngestFnInput };
