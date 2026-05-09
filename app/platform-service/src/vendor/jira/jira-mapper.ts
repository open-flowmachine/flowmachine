import { Err } from "@/shared/err/err";

const mapJiraError = (error: unknown) => {
  return Err.from(error, { message: "Jira API error" });
};

export { mapJiraError };
