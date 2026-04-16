import type { DomainEvent } from "@/domain/shared/domain-event";
import type { Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import { touchMetadata } from "@/domain/shared/metadata";

abstract class AggregateRoot<
  TId extends string,
  TDomainEvent extends DomainEvent,
> {
  readonly id: TId;
  readonly tenant: Tenant;
  #metadata: Metadata;
  #events: TDomainEvent[] = [];

  protected constructor(input: {
    id: TId;
    tenant: Tenant;
    metadata: Metadata;
  }) {
    this.id = input.id;
    this.tenant = input.tenant;
    this.#metadata = input.metadata;
  }

  get metadata(): Metadata {
    return this.#metadata;
  }

  get version(): number {
    return this.#metadata.version;
  }

  protected touch(now: Date): void {
    this.#metadata = touchMetadata(this.#metadata, now);
  }

  protected raise(event: TDomainEvent): void {
    this.#events.push(event);
  }

  pullDomainEvents(): readonly TDomainEvent[] {
    const events = this.#events;
    this.#events = [];
    return events;
  }
}

export { AggregateRoot };
