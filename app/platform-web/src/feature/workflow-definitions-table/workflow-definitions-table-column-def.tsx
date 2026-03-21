import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { DataTableColumnHeader } from "@/component/extended-ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/component/ui/alert-dialog";
import { Badge } from "@/component/ui/badge";
import { Button } from "@/component/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { Spinner } from "@/component/ui/spinner";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";

type MakeWorkflowDefinitionsTableColumnDefInput = {
  isDeleteConfirmationAlertOpen: boolean;
  isDeleting: boolean;
  onDeleteActionCancel: () => void;
  onDeleteActionConfirm: (id: WorkflowDefinition["id"]) => void;
  onDeleteActionTrigger: () => void;
};

export const makeWorkflowDefinitionsTableColumnDef = ({
  isDeleteConfirmationAlertOpen,
  isDeleting,
  onDeleteActionCancel,
  onDeleteActionConfirm,
  onDeleteActionTrigger,
}: MakeWorkflowDefinitionsTableColumnDefInput) => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/platform/workflow/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string | undefined;
        if (!description)
          return <span className="text-muted-foreground">-</span>;
        return (
          <span className="block max-w-[200px] truncate" title={description}>
            {description}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const workflowDefinitionDomainService =
          makeWorkflowDefinitionService({
            workflowDefinition: row.original,
          });
        return (
          <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
            {workflowDefinitionDomainService.getStatusLabel()}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => {
        const actions = row.original.actions;
        return <span>{actions.length}</span>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const workflowDefinitionDomainService =
          makeWorkflowDefinitionService({
            workflowDefinition: row.original,
          });
        return <span>{workflowDefinitionDomainService.getCreatedAt()}</span>;
      },
      enableSorting: false,
    },
    {
      id: "rowActions",
      cell: ({ row }) => {
        const workflow = row.original;

        return (
          <AlertDialog open={isDeleteConfirmationAlertOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href={`/platform/workflow/${workflow.id}`} />}
                >
                  <PencilIcon />
                  Edit
                </DropdownMenuItem>
                <AlertDialogTrigger
                  nativeButton={false}
                  onClick={onDeleteActionTrigger}
                  render={
                    <DropdownMenuItem className="text-destructive focus:text-destructive" />
                  }
                >
                  <TrashIcon />
                  Delete
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete workflow</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{workflow.name}
                  &rdquo;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isDeleting}
                  onClick={onDeleteActionCancel}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={() => onDeleteActionConfirm(workflow.id)}
                >
                  {isDeleting ? (
                    <>
                      <Spinner />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ] satisfies ColumnDef<WorkflowDefinition>[];
};
