"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "@/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { Button } from "@/component/ui/button";
import { makeCredentialsTableColumnDef } from "@/feature/credentials-table/credentials-table-column-def";
import { useConfirmableAction } from "@/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import type { Credential } from "@/module/credential/credential-type";
import { useDeleteCredential } from "@/module/credential/use-delete-credential";
import { useListCredentials } from "@/module/credential/use-list-credentials";

export default function CredentialsTablePage() {
  const deleteAction = useConfirmableAction();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending } = useListCredentials();
  const { mutateAsync, isPending: isDeleteCredentialPending } =
    useDeleteCredential();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteCredentialActionTrigger = deleteAction.triggerAction;
  const handleDeleteCredentialActionCancel = deleteAction.resetAction;
  const handleDeleteCredentialActionConfirm =
    deleteAction.withConfirmableAction(async (id: Credential["id"]) => {
      await mutateAsync({ params: { id } });
    });

  return (
    <PlatformPageTemplate heading="Credential" isPending={isPending}>
      <div className="space-y-2.5">
        <div className="flex w-full justify-end">
          <Button
            nativeButton={false}
            render={(props) => (
              <Link href="/platform/credential/new" {...props} />
            )}
          >
            <PlusIcon />
            New Credential
          </Button>
        </div>
        <DataTable
          columns={makeCredentialsTableColumnDef({
            isDeleteConfirmationAlertOpen:
              deleteAction.step === "confirmation" ||
              deleteAction.step === "inProgress",
            isDeleting:
              deleteAction.step === "inProgress" || isDeleteCredentialPending,
            onCopyAction: handleCopyAction,
            onDeleteActionCancel: handleDeleteCredentialActionCancel,
            onDeleteActionConfirm: handleDeleteCredentialActionConfirm,
            onDeleteActionTrigger: handleDeleteCredentialActionTrigger,
          })}
          data={data ?? []}
          searchKey="type"
          searchPlaceholder="Filter credentials..."
        />
      </div>
    </PlatformPageTemplate>
  );
}
