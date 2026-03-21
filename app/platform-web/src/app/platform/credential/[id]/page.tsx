import { EditableCredentialDetailsPage } from "@/feature/editable-credential-details/editable-credential-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditableCredentialDetailsPage id={id} />;
}
