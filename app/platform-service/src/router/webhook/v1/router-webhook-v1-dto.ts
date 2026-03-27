import z from "zod";

const webhookJiraQueryDtoSchema = z.object({
  tenant: z.string().min(1),
});

const jiraIssueUpdatedEventDtoSchema = z.object({
  webhookEvent: z.literal("jira:issue_updated"),
  issue: z.object({
    id: z.string(),
    key: z.string(),
    fields: z.object({
      summary: z.string(),
      description: z.string().nullable().optional(),
    }),
  }),
});

type JiraIssueUpdatedEventDto = z.infer<typeof jiraIssueUpdatedEventDtoSchema>;

export {
  webhookJiraQueryDtoSchema,
  jiraIssueUpdatedEventDtoSchema,
  type JiraIssueUpdatedEventDto,
};
