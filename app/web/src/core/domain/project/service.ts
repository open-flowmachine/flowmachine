import { format } from "date-fns";
import type {
  ProjectDomain,
  projectProviders,
} from "@/core/domain/project/entity";

type MakeProjectDomainServiceInput = {
  project: ProjectDomain;
};

export const makeProjectDomainService = ({
  project,
}: MakeProjectDomainServiceInput) => ({
  getCreatedAt: () => format(project.createdAt, "MMM d, yyyy, h:mm a"),
  getUpdatedAt: () => format(project.updatedAt, "MMM d, yyyy, h:mm a"),
});

export const projectProviderToDisplayName = {
  jira: "Jira",
  linear: "Linear",
} as const satisfies Record<(typeof projectProviders)[number], string>;
