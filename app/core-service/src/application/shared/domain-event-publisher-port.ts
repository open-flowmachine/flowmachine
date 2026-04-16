import type { DomainEvent } from "@/domain/shared/domain-event";
import type { Result } from "@/domain/shared/result";

import type { ApplicationError } from "@/application/shared/errors";

type DomainEventPublisherPort = {
  publish(
    events: readonly DomainEvent[],
  ): Promise<Result<void, ApplicationError>>;
};

export type { DomainEventPublisherPort };
