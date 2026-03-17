"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ProjectDomain } from "@/core/domain/project/entity";
import { DataTable } from "@/presentation/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/presentation/component/platform/platform-page-template";
import { Button } from "@/presentation/component/ui/button";
import { makeProjectsTableColumnDef } from "@/presentation/feature/projects-table/projects-table-column-def";
import { useDeleteProject } from "@/presentation/hook/project/use-delete-project";
import { useListProjects } from "@/presentation/hook/project/use-list-projects";
import { useSyncProject } from "@/presentation/hook/project/use-sync-project";
import { useConfirmableAction } from "@/presentation/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/presentation/hook/use-copy-to-clipboard";

type ProjectsTablePageProps = {
  initialData?: ProjectDomain[];
};

export default function ProjectsTablePage({
  initialData,
}: ProjectsTablePageProps) {
  const deleteAction = useConfirmableAction();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending } = useListProjects({ initialData });
  const { mutateAsync, isPending: isDeleteProjectPending } = useDeleteProject();
  const { mutateAsync: syncMutateAsync, isPending: isSyncProjectPending } =
    useSyncProject();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteProjectActionTrigger = deleteAction.triggerAction;
  const handleDeleteProjectActionCancel = deleteAction.resetAction;
  const handleDeleteProjectActionConfirm = deleteAction.withConfirmableAction(
    async (id: ProjectDomain["id"]) => {
      await mutateAsync({ params: { id } });
    },
  );

  const handleSyncAction = async (id: ProjectDomain["id"]) => {
    try {
      await syncMutateAsync({ params: { id } });
      toast.success("Project synced successfully");
    } catch {
      toast.error("Failed to sync project");
    }
  };

  return (
    <PlatformPageTemplate heading="Project" isPending={isPending}>
      <div className="space-y-2.5">
        <div className="flex w-full justify-end">
          <Button
            nativeButton={false}
            render={(props) => <Link href="/platform/project/new" {...props} />}
          >
            <PlusIcon />
            New Project
          </Button>
        </div>
        <DataTable
          columns={makeProjectsTableColumnDef({
            isDeleteConfirmationAlertOpen:
              deleteAction.step === "confirmation" ||
              deleteAction.step === "inProgress",
            isDeleting:
              deleteAction.step === "inProgress" || isDeleteProjectPending,
            isSyncing: isSyncProjectPending,
            onCopyAction: handleCopyAction,
            onDeleteActionCancel: handleDeleteProjectActionCancel,
            onDeleteActionConfirm: handleDeleteProjectActionConfirm,
            onDeleteActionTrigger: handleDeleteProjectActionTrigger,
            onSyncAction: handleSyncAction,
          })}
          data={data ?? []}
          searchKey="name"
          searchPlaceholder="Filter projects..."
        />
      </div>
    </PlatformPageTemplate>
  );
}
