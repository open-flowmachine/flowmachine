import { randomUUIDv7 } from "bun";

type Brand<TBase, TName extends string> = TBase & {
  readonly __brand: TName;
};

const newId = (): string => randomUUIDv7();

export { newId };
export type { Brand };
