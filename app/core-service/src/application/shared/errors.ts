import type {
  DomainError,
  DomainErrorCategory,
} from "@/domain/shared/errors";

const errCodes = [
  "unknown",
  "unauthorized",
  "forbidden",
  "notFound",
  "conflict",
  "badRequest",
  "unprocessableEntity",
] as const;
type ErrCode = (typeof errCodes)[number];

const errCodeDefaults: Record<ErrCode, { message: string; status: number }> = {
  unknown: { message: "Internal server error", status: 500 },
  unauthorized: { message: "Unauthorized", status: 401 },
  forbidden: { message: "Forbidden", status: 403 },
  notFound: { message: "Resource not found", status: 404 },
  conflict: { message: "Resource conflict", status: 409 },
  badRequest: { message: "Bad request", status: 400 },
  unprocessableEntity: { message: "Unprocessable entity", status: 422 },
};

class ApplicationError extends Error {
  readonly code: ErrCode;

  constructor(
    code: ErrCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? errCodeDefaults[code].message, options);
    this.code = code;
  }

  get status(): number {
    return errCodeDefaults[this.code].status;
  }
}

const domainCategoryToErrCode: Record<DomainErrorCategory, ErrCode> = {
  "not-found": "notFound",
  "invariant-violated": "unprocessableEntity",
  conflict: "conflict",
  "invalid-transition": "conflict",
  "infrastructure-failure": "unknown",
};

const mapDomainError = (error: DomainError): ApplicationError =>
  new ApplicationError(domainCategoryToErrCode[error.category], error.message, {
    cause: error,
  });

export {
  ApplicationError,
  errCodes,
  errCodeDefaults,
  domainCategoryToErrCode,
  mapDomainError,
};
export type { ErrCode };
