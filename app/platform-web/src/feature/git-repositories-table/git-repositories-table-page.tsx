"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "@/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { Button } from "@/component/ui/button";
import { makeGitRepositoriesTableColumnDef } from "@/feature/git-repositories-table/git-repositories-table-column-def";
import { useConfirmableAction } from "@/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import type { GitRepository } from "@/module/git-repository/git-repository-type";
import { useDeleteGitRepository } from "@/module/git-repository/use-delete-git-repository";
import { useListGitRepositories } from "@/module/git-repository/use-list-git-repositories";

export default function GitRepositoriesTablePage() {
  const deleteAction = useConfirmableAction();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending } = useListGitRepositories();
  const { mutateAsync, isPending: isDeleteGitRepositoryPending } =
    useDeleteGitRepository();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteActionTrigger = deleteAction.triggerAction;
  const handleDeleteActionCancel = deleteAction.resetAction;
  const handleDeleteActionConfirm = deleteAction.withConfirmableAction(
    async (id: GitRepository["id"]) => {
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
