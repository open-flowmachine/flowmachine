type DomainEvent<
  TName extends string = string,
  TPayload = Readonly<Record<string, unknown>>,
> = {
  readonly name: TName;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
};

export type { DomainEvent };
