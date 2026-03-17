import { getCredential } from "@/action/credential/get-credential";
import { EditableCredentialDetailsPage } from "@/presentation/feature/editable-credential-details/editable-credential-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getCredential(id);
  return <EditableCredentialDetailsPage id={id} initialData={initialData} />;
}
