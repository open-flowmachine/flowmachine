import { getGitRepository } from "@/action/git-repository/get-git-repository";
import { EditableGitRepositoryDetailsPage } from "@/presentation/feature/editable-git-repository-details/editable-git-repository-details-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getGitRepository(id);
  return <EditableGitRepositoryDetailsPage id={id} initialData={initialData} />;
}
