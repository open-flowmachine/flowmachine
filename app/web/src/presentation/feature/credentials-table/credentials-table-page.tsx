"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { CredentialDomain } from "@/core/domain/credential/entity";
import { DataTable } from "@/presentation/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/presentation/component/platform/platform-page-template";
import { Button } from "@/presentation/component/ui/button";
import { makeCredentialsTableColumnDef } from "@/presentation/feature/credentials-table/credentials-table-column-def";
import { useDeleteCredential } from "@/presentation/hook/credential/use-delete-credential";
import { useListCredentials } from "@/presentation/hook/credential/use-list-credentials";
import { useConfirmableAction } from "@/presentation/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/presentation/hook/use-copy-to-clipboard";

type CredentialsTablePageProps = {
  initialData?: CredentialDomain[];
};

export default function CredentialsTablePage({
  initialData,
}: CredentialsTablePageProps) {
  const deleteAction = useConfirmableAction();
  const [_, copyToClipboard] = useCopyToClipboard();

  const { data, isPending } = useListCredentials({ initialData });
  const { mutateAsync, isPending: isDeleteCredentialPending } =
    useDeleteCredential();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteCredentialActionTrigger = deleteAction.triggerAction;
  const handleDeleteCredentialActionCancel = deleteAction.resetAction;
  const handleDeleteCredentialActionConfirm =
    deleteAction.withConfirmableAction(async (id: CredentialDomain["id"]) => {
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
