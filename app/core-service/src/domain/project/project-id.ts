import type { Brand } from "@/domain/shared/id";

type ProjectId = Brand<string, "ProjectId">;
const ProjectId = (value: string): ProjectId => value as ProjectId;

export { ProjectId };
