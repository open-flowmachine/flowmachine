import { isString } from "es-toolkit";
import { type ErrCode, errDetails } from "@/err/err-details";

class Err extends Error {
  code: ErrCode;

  constructor(code: ErrCode, message: string, cause: unknown) {
    super(message, { cause });
    this.code = code;
  }

  static code(
    code: ErrCode,
    options: { cause?: unknown; message?: string } = {},
  ) {
    return Err.from(code, options);
  }

  static from(
    error: unknown,
    options: { cause?: unknown; message?: string } = {},
  ) {
    if (error instanceof Err) {
      return error;
    }

    if (isString(error) && Object.hasOwn(errDetails, error)) {
      const code = error as ErrCode;
      const details = errDetails[code];
      return new Err(code, options.message ?? details.message, options.cause);
    }

    const fallbackCode = "unknown" as const;
    const details = errDetails[fallbackCode];
    return new Err(
      fallbackCode,
      options.message ?? details.message,
      options.cause,
    );
  }

  get status() {
    return errDetails[this.code].status;
  }
}

export { Err };
