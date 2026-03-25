import { noop } from "es-toolkit";
import { HttpResponse, http } from "msw";
import type { HttpEnvelope } from "@/lib/http/http-schema";

const defaultHttpResponse = {
  status: 200,
  code: "ok",
  message: "ok",
  data: undefined,
} as const satisfies HttpEnvelope<unknown>;

const makeBaseMswHandler =
  <T = unknown>(input1: {
    method: "get" | "post" | "delete" | "patch";
    url: string;
  }) =>
  (input2?: Partial<HttpEnvelope<T>>) => {
    const { method, url } = input1;

    let resolveRequest = noop;
    const promise = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const envelope = {
      ...defaultHttpResponse,
      ...input2,
    };
    const handler = http[method](url, async () => {
      await promise;
      return HttpResponse.json(envelope, { status: envelope.status });
    });

    return Object.assign(handler, { resolveRequest });
  };

export { makeBaseMswHandler };
