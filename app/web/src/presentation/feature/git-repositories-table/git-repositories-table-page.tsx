"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { GitRepositoryDomain } from "@/core/domain/git-repository/entity";
import { DataTable } from "@/presentation/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/presentation/component/platform/platform-page-template";
import { Button } from "@/presentation/component/ui/button";
import { makeGitRepositoriesTableColumnDef } from "@/presentation/feature/git-repositories-table/git-repositories-table-column-def";
import { useDeleteGitRepository } from "@/presentation/hook/git-repository/use-delete-git-repository";
import { useListGitRepositories } from "@/presentation/hook/git-repository/use-list-git-repositories";
import { useConfirmableAction } from "@/presentation/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/presentation/hook/use-copy-to-clipboard";

type GitRepositoriesTablePageProps = {
  initialData?: GitRepositoryDomain[];
};

export default function GitRepositoriesTablePage({
  initialData,
}: GitRepositoriesTablePageProps) {
  const deleteAction = useConfirmableAction();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending } = useListGitRepositories({ initialData });
  const { mutateAsync, isPending: isDeleteGitRepositoryPending } =
    useDeleteGitRepository();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteActionTrigger = deleteAction.triggerAction;
  const handleDeleteActionCancel = deleteAction.resetAction;
  const handleDeleteActionConfirm = deleteAction.withConfirmableAction(
    async (id: GitRepositoryDomain["id"]) => {
      await mutateAsync({ params: { id } });
    },
  );

  return (
    <PlatformPageTemplate heading="Git Repository" isPending={isPending}>
      <div className="space-y-2.5">
        <div className="flex w-full justify-end">
          <Button
            nativeButton={false}
            render={(props) => (
              <Link href="/platform/git-repository/new" {...props} />
            )}
          >
            <PlusIcon />
            Add Repository
          </Button>
        </div>
        <DataTable
          columns={makeGitRepositoriesTableColumnDef({
            isDeleteConfirmationAlertOpen:
              deleteAction.step === "confirmation" ||
              deleteAction.step === "inProgress",
            isDeleting:
              deleteAction.step === "inProgress" ||
              isDeleteGitRepositoryPending,
            onCopyAction: handleCopyAction,
            onDeleteActionCancel: handleDeleteActionCancel,
            onDeleteActionConfirm: handleDeleteActionConfirm,
            onDeleteActionTrigger: handleDeleteActionTrigger,
          })}
          data={data ?? []}
          searchKey="name"
          searchPlaceholder="Filter repositories..."
        />
      </div>
    </PlatformPageTemplate>
  );
}
