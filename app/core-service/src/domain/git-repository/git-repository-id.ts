import type { Brand } from "@/domain/shared/id";

type GitRepositoryId = Brand<string, "GitRepositoryId">;
const GitRepositoryId = (value: string): GitRepositoryId =>
  value as GitRepositoryId;

export { GitRepositoryId };
