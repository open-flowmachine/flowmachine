"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ProjectDomain } from "@/domain/entity/project/project-domain-schema";
import { DataTable } from "@/frontend/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/frontend/component/platform/platform-page-template";
import { Button } from "@/frontend/component/ui/button";
import { makeProjectsTableColumnDef } from "@/frontend/feature/projects-table/projects-table-column-def";
import { useDeleteProject } from "@/frontend/hook/project/use-delete-project";
import { useListProjects } from "@/frontend/hook/project/use-list-projects";
import { useConfirmableAction } from "@/frontend/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/frontend/hook/use-copy-to-clipboard";

export default function ProjectsTablePage() {
  const deleteAction = useConfirmableAction();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending } = useListProjects();
  const { mutateAsync, isPending: isDeleteProjectPending } = useDeleteProject();

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
            onCopyAction: handleCopyAction,
            onDeleteActionCancel: handleDeleteProjectActionCancel,
            onDeleteActionConfirm: handleDeleteProjectActionConfirm,
            onDeleteActionTrigger: handleDeleteProjectActionTrigger,
          })}
          data={data ?? []}
          searchKey="name"
          searchPlaceholder="Filter projects..."
        />
      </div>
    </PlatformPageTemplate>
  );
}
