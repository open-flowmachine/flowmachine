import type { Result } from "@/domain/shared/result";

import type { ApplicationError } from "@/application/shared/errors";

type IntegrationEvent = {
  readonly name: string;
  readonly data: Readonly<Record<string, unknown>>;
};

type IntegrationEventPublisherPort = {
  publish(event: IntegrationEvent): Promise<Result<void, ApplicationError>>;
};

export type { IntegrationEvent, IntegrationEventPublisherPort };
