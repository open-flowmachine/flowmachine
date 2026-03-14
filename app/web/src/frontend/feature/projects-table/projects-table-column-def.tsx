import type { ColumnDef } from "@tanstack/react-table";
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import type { ProjectDomain } from "@/domain/entity/project/project-domain-schema";
import { makeProjectDomainService } from "@/domain/entity/project/project-domain-service";
import { DataTableColumnHeader } from "@/frontend/component/extended-ui/data-table";
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
} from "@/frontend/component/ui/alert-dialog";
import { Button } from "@/frontend/component/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/component/ui/dropdown-menu";
import { Spinner } from "@/frontend/component/ui/spinner";

type MakeProjectsTableColumnDefInput = {
  isDeleteConfirmationAlertOpen: boolean;
  isDeleting: boolean;
  isSyncing: boolean;
  onCopyAction: (text: string) => void;
  onDeleteActionCancel: () => void;
  onDeleteActionConfirm: (id: ProjectDomain["id"]) => void;
  onDeleteActionTrigger: () => void;
  onSyncAction: (id: ProjectDomain["id"]) => void;
};

export const makeProjectsTableColumnDef = ({
  isDeleteConfirmationAlertOpen,
  isDeleting,
  isSyncing,
  onCopyAction,
  onDeleteActionCancel,
  onDeleteActionConfirm,
  onDeleteActionTrigger,
  onSyncAction,
}: MakeProjectsTableColumnDefInput) => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/platform/project/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const projectDomainService = makeProjectDomainService({
          project: row.original,
        });
        return <span>{projectDomainService.getCreatedAt()}</span>;
      },
      enableSorting: false,
    },
    {
      id: "rowActions",
      cell: ({ row }) => {
        const project = row.original;

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
                <DropdownMenuItem onClick={() => onCopyAction(project.id)}>
                  <CopyIcon />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href={`/platform/project/${project.id}`} />}
                >
                  <PencilIcon />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isSyncing}
                  onClick={() => onSyncAction(project.id)}
                >
                  {isSyncing ? <Spinner /> : <RefreshCwIcon />}
                  {isSyncing ? "Syncing..." : "Sync"}
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
                <AlertDialogTitle>Delete project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{project.name}&rdquo;?
                  This action cannot be undone.
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
                  onClick={() => onDeleteActionConfirm(project.id)}
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
  ] satisfies ColumnDef<ProjectDomain>[];
};
