"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import type { WorkflowDefinitionDomain } from "@/core/domain/workflow-definition/entity";
import { DataTable } from "@/presentation/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/presentation/component/platform/platform-page-template";
import { Button } from "@/presentation/component/ui/button";
import { makeWorkflowDefinitionsTableColumnDef } from "@/presentation/feature/workflow-definitions-table/workflow-definitions-table-column-def";
import { useConfirmableAction } from "@/presentation/hook/use-confirmable-action";
import { useDeleteWorkflowDefinition } from "@/presentation/hook/workflow-definition/use-delete-workflow-definition";
import { useListWorkflowDefinitions } from "@/presentation/hook/workflow-definition/use-list-workflow-definitions";

type WorkflowDefinitionsTablePageProps = {
  initialData?: WorkflowDefinitionDomain[];
};

export default function WorkflowDefinitionsTablePage({
  initialData,
}: WorkflowDefinitionsTablePageProps) {
  const deleteAction = useConfirmableAction();

  const { data, isPending } = useListWorkflowDefinitions({ initialData });
  const { mutateAsync, isPending: isDeleteWorkflowDefinitionPending } =
    useDeleteWorkflowDefinition();

  const handleDeleteActionTrigger = deleteAction.triggerAction;
  const handleDeleteActionCancel = deleteAction.resetAction;
  const handleDeleteActionConfirm = deleteAction.withConfirmableAction(
    async (id: WorkflowDefinitionDomain["id"]) => {
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
