import { EditableWorkflowDefinitionDetailsPage } from "@/feature/editable-workflow-definition-details/editable-workflow-definition-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditableWorkflowDefinitionDetailsPage id={id} />;
}
