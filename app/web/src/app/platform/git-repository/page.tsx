import { listGitRepositories } from "@/action/git-repository/list-git-repositories";
import GitRepositoriesTablePage from "@/presentation/feature/git-repositories-table/git-repositories-table-page";

export default async function Page() {
  const initialData = await listGitRepositories();
  return <GitRepositoriesTablePage initialData={initialData} />;
}
