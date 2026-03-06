interface DurableFunctionContext {
  event: { data: Record<string, unknown> };
  step: {
    run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
    sleep: (id: string, duration: string | number) => Promise<void>;
    sleepUntil: (id: string, date: Date | string) => Promise<void>;
    waitForEvent: (
      id: string,
      opts: { event: string; timeout: string; match?: string },
    ) => Promise<unknown>;
    sendEvent: (
      id: string,
      events: { name: string; data: Record<string, unknown> }[],
    ) => Promise<void>;
  };
}

export type { DurableFunctionContext };
