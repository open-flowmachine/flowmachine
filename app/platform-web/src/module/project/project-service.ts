import { format } from "date-fns";
import type {
  Project,
  projectProviders,
} from "@/module/project/project-type";

const projectProviderToDisplayName = {
  jira: "Jira",
  linear: "Linear",
} as const satisfies Record<(typeof projectProviders)[number], string>;

const makeProjectService = (input: { project: Project }) => {
  const { project } = input;
  return {
    getCreatedAt: () => format(project.createdAt, "MMM d, yyyy, h:mm a"),
    getUpdatedAt: () => format(project.updatedAt, "MMM d, yyyy, h:mm a"),
  };
};

export { makeProjectService, projectProviderToDisplayName };
