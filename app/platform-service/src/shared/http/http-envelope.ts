import { isNil, omitBy } from "es-toolkit";
import type { Err } from "@/shared/err/err";

type HttpEnvelope<T> = {
  status: number;
  code: string;
  message: string;
  data?: T | undefined;
};

const okEnvelope = <T = undefined>({
  status = 200,
  code = "ok",
  message = "ok",
  data = undefined,
}: Partial<HttpEnvelope<T>> = {}) => {
  return omitBy({ status, code, message, data }, isNil) as HttpEnvelope<T>;
};

const errEnvelope = (err: Err) => {
  return {
    status: err.status,
    code: err.code,
    message: err.message,
  } as const;
};

export { okEnvelope, errEnvelope };
export type { HttpEnvelope };
