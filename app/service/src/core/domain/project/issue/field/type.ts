import z from "zod";

const projectIssueFieldTypes = ["select"] as const;
const projectIssueFieldTypeSchema = z.enum(projectIssueFieldTypes);

type IssueFieldType = z.infer<typeof projectIssueFieldTypeSchema>;

export {
  projectIssueFieldTypes,
  projectIssueFieldTypeSchema,
  type IssueFieldType,
};
