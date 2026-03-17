import { z } from "zod/v4";

export const httpEnvelopeSchema = z.object({
  status: z.number(),
  code: z.string(),
  message: z.string(),
  data: z.unknown(),
});

export type HttpEnvelope<T = undefined> = Omit<
  z.infer<typeof httpEnvelopeSchema>,
  "data"
> & { data: T };

export const okHttpEnvelope = <T = undefined>({
  code,
  data,
  message,
  status,
}: Partial<HttpEnvelope<T>> = {}): HttpEnvelope<T> => ({
  code: code ?? "ok",
  data: data as T,
  message: message ?? "ok",
  status: status ?? 200,
});
