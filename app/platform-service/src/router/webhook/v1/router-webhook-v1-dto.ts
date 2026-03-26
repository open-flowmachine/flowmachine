import z from "zod";

const webhookJiraQueryDtoSchema = z.object({
  tenant: z.string().min(1),
});

export { webhookJiraQueryDtoSchema };
