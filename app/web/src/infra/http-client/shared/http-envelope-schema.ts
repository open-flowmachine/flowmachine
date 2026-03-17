import z from "zod/v4";

export const baseHttpClientResponseDtoSchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const tenantAwareBaseHttpClientResponseDtoSchema = z.object({
  ...baseHttpClientResponseDtoSchema.shape,
  tenant: z.object({
    id: z.string(),
    type: z.enum(["organization", "user"]),
  }),
});

export const idParamsSchema = z.object({
  id: z.string(),
});
export type IdParams = z.infer<typeof idParamsSchema>;

export const withHttpEnvelopeSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
    data: data,
  });
