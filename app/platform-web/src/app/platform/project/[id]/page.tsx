import { EditableProjectDetailsPage } from "@/feature/editable-project-details/editable-project-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditableProjectDetailsPage id={id} />;
}
