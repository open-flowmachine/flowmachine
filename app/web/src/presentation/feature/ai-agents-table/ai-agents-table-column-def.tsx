import type { ColumnDef } from "@tanstack/react-table";
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import type { AiAgentDomain } from "@/core/domain/ai-agent/entity";
import { makeAiAgentDomainService } from "@/core/domain/ai-agent/service";
import { DataTableColumnHeader } from "@/presentation/component/extended-ui/data-table";
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
} from "@/presentation/component/ui/alert-dialog";
import { Badge } from "@/presentation/component/ui/badge";
import { Button } from "@/presentation/component/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/presentation/component/ui/dropdown-menu";
import { Spinner } from "@/presentation/component/ui/spinner";

type MakeAiAgentsTableColumnDefInput = {
  isDeleteConfirmationAlertOpen: boolean;
  isDeleting: boolean;
  onDeleteActionCancel: () => void;
  onDeleteActionConfirm: (id: AiAgentDomain["id"]) => void;
  onDeleteActionTrigger: () => void;
  onCopyAction: (text: string) => void;
};

export const makeAiAgentsTableColumnDef = ({
  isDeleteConfirmationAlertOpen,
  isDeleting,
  onDeleteActionCancel,
  onDeleteActionConfirm,
  onDeleteActionTrigger,
  onCopyAction,
}: MakeAiAgentsTableColumnDefInput) => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/platform/ai-agent/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "model",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => {
        const aiAgentDomainService = makeAiAgentDomainService({
          aiAgent: row.original,
        });
        return (
          <Badge variant="secondary">
            {aiAgentDomainService.getModelDisplayName()}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const aiAgentDomainService = makeAiAgentDomainService({
          aiAgent: row.original,
        });
        return <span>{aiAgentDomainService.getCreatedAt()}</span>;
      },
      enableSorting: false,
    },
    {
      id: "rowActions",
      cell: ({ row }) => {
        const aiAgent = row.original;

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
                <DropdownMenuItem onClick={() => onCopyAction(aiAgent.id)}>
                  <CopyIcon />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton={false}
                  render={<Link href={`/platform/ai-agent/${aiAgent.id}`} />}
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
                <AlertDialogTitle>Delete AI agent</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &ldquo;{aiAgent.name}&rdquo;?
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
                  onClick={() => onDeleteActionConfirm(aiAgent.id)}
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
  ] satisfies ColumnDef<AiAgentDomain>[];
};
