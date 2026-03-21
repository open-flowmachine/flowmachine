import { EditableGitRepositoryDetailsPage } from "@/feature/editable-git-repository-details/editable-git-repository-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditableGitRepositoryDetailsPage id={id} />;
}
