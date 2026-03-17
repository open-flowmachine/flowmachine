import { listProjects } from "@/action/project/list-projects";
import ProjectsTablePage from "@/presentation/feature/projects-table/projects-table-page";

export default async function Page() {
  const initialData = await listProjects();
  return <ProjectsTablePage initialData={initialData} />;
}
