import { getProject } from "@/action/project/get-project";
import { EditableProjectDetailsPage } from "@/presentation/feature/editable-project-details/editable-project-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getProject(id);
  return <EditableProjectDetailsPage id={id} initialData={initialData} />;
}
