const errDetails = {
  unknown: {
    message: "Internal server error",
    status: 500,
  },
  unauthorized: {
    message: "Unauthorized",
    status: 401,
  },
  forbidden: {
    message: "Forbidden",
    status: 403,
  },
  notFound: {
    message: "Resource not found",
    status: 404,
  },
  conflict: {
    message: "Resource conflict",
    status: 409,
  },
  badRequest: {
    message: "Bad request",
    status: 400,
  },
  unprocessableEntity: {
    message: "Unprocessable entity",
    status: 422,
  },
} as const satisfies Record<string, { status: number; message: string }>;

type ErrDetails = typeof errDetails;
type ErrCode = keyof ErrDetails;

export { errDetails };
export type { ErrCode, ErrDetails };
