import type { Result } from "@/domain/shared/result";

import type { ApplicationError } from "@/application/shared/errors";

type WebhookSignatureVerifierPort = {
  verify(input: {
    rawBody: string;
    secret: string;
    signatureHeader: string;
  }): Result<void, ApplicationError>;
};

export type { WebhookSignatureVerifierPort };
