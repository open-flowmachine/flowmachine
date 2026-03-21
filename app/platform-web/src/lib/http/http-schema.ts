import { z } from "zod/v4";

type HttpEnvelope<T = undefined> = {
  status: number;
  code: string;
  message: string;
  data: T;
};

const withHttpEnvelopeSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
    data: data,
  });

export { withHttpEnvelopeSchema };
export type { HttpEnvelope };
