import { listWorkflowDefinitions } from "@/action/workflow-definition/list-workflow-definitions";
import WorkflowDefinitionsTablePage from "@/presentation/feature/workflow-definitions-table/workflow-definitions-table-page";

export default async function Page() {
  const initialData = await listWorkflowDefinitions();
  return <WorkflowDefinitionsTablePage initialData={initialData} />;
}
