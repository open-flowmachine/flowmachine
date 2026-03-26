import z from "zod";

const webhookJiraQueryDtoSchema = z.object({
  secret: z.string().min(1),
  tenant: z.string().min(1),
});

export { webhookJiraQueryDtoSchema };
