"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { Button } from "@/component/ui/button";
import { makeWorkflowDefinitionsTableColumnDef } from "@/feature/workflow-definitions-table/workflow-definitions-table-column-def";
import { useConfirmableAction } from "@/hook/use-confirmable-action";
import { useDeleteWorkflowDefinition } from "@/module/workflow/use-delete-workflow-definition";
import { useListWorkflowDefinitions } from "@/module/workflow/use-list-workflow-definitions";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

export default function WorkflowDefinitionsTablePage() {
  const deleteAction = useConfirmableAction();

  const { data, isPending } = useListWorkflowDefinitions();
  const { mutateAsync, isPending: isDeleteWorkflowDefinitionPending } =
    useDeleteWorkflowDefinition();

  const handleDeleteActionTrigger = deleteAction.triggerAction;
  const handleDeleteActionCancel = deleteAction.resetAction;
  const handleDeleteActionConfirm = deleteAction.withConfirmableAction(
    async (id: WorkflowDefinition["id"]) => {
      await mutateAsync({ params: { id } });
    },
  );

  return (
    <PlatformPageTemplate heading="Workflow" isPending={isPending}>
      <div className="space-y-2.5">
        <div className="flex w-full justify-end">
          <Button
            nativeButton={false}
            render={(props) => (
              <Link href="/platform/workflow/new" {...props} />
            )}
          >
            <PlusIcon />
            Create Workflow
          </Button>
        </div>
        <DataTable
          columns={makeWorkflowDefinitionsTableColumnDef({
            isDeleteConfirmationAlertOpen:
              deleteAction.step === "confirmation" ||
              deleteAction.step === "inProgress",
            isDeleting:
              deleteAction.step === "inProgress" ||
              isDeleteWorkflowDefinitionPending,
            onDeleteActionCancel: handleDeleteActionCancel,
            onDeleteActionConfirm: handleDeleteActionConfirm,
            onDeleteActionTrigger: handleDeleteActionTrigger,
          })}
          data={data ?? []}
          searchKey="name"
          searchPlaceholder="Filter workflows..."
        />
      </div>
    </PlatformPageTemplate>
  );
}
