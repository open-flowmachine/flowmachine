import type { ColumnDef } from "@tanstack/react-table";
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import type { GitRepositoryDomain } from "@/domain/entity/git-repository/git-repository-domain-schema";
import { makeGitRepositoryDomainService } from "@/domain/entity/git-repository/git-repository-domain-service";
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
import { Badge } from "@/frontend/component/ui/badge";
import { Button } from "@/frontend/component/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/component/ui/dropdown-menu";
import { Spinner } from "@/frontend/component/ui/spinner";

type MakeGitRepositoriesTableColumnDefInput = {
  isDeleteConfirmationAlertOpen: boolean;
  isDeleting: boolean;
  onCopyAction: (text: string) => void;
  onDeleteActionCancel: () => void;
  onDeleteActionConfirm: (id: GitRepositoryDomain["id"]) => void;
  onDeleteActionTrigger: () => void;
};

export const makeGitRepositoriesTableColumnDef = ({
  isDeleteConfirmationAlertOpen,
  isDeleting,
  onCopyAction,
  onDeleteActionCancel,
  onDeleteActionConfirm,
  onDeleteActionTrigger,
}: MakeGitRepositoriesTableColumnDefInput) => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/platform/git-repository/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "url",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="URL" />
      ),
      cell: ({ row }) => {
        const url = row.getValue("url") as string;
        return (
          <span className="block max-w-[250px] truncate" title={url}>
            {url}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      id: "provider",
      accessorFn: (row) => row.integration.provider,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider" />
      ),
      cell: ({ row }) => {
        const gitRepositoryDomainService = makeGitRepositoryDomainService({
          gitRepository: row.original,
        });
        return (
          <Badge variant="secondary">
            {gitRepositoryDomainService.getProviderDisplayName()}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      id: "defaultBranch",
      accessorFn: (row) => row.config.defaultBranch,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Branch" />
      ),
      cell: ({ row }) => {
        const branch = row.original.config.defaultBranch;
        return <span>{branch}</span>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const gitRepositoryDomainService = makeGitRepositoryDomainService({
          gitRepository: row.original,
        });
        return <span>{gitRepositoryDomainService.getCreatedAt()}</span>;
      },
      enableSorting: false,
    },
    {
      id: "rowActions",
      cell: ({ row }) => {
        const repository = row.original;

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
                <DropdownMenuItem onClick={() => onCopyAction(repository.id)}>
                  <CopyIcon />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <Link href={`/platform/git-repository/${repository.id}`} />
                  }
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
                <AlertDialogTitle>Delete repository</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{repository.name}
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
                  onClick={() => onDeleteActionConfirm(repository.id)}
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
  ] satisfies ColumnDef<GitRepositoryDomain>[];
};
