"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { AiAgentDomain } from "@/core/domain/ai-agent/entity";
import { DataTable } from "@/presentation/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/presentation/component/platform/platform-page-template";
import { Button } from "@/presentation/component/ui/button";
import { makeAiAgentsTableColumnDef } from "@/presentation/feature/ai-agents-table/ai-agents-table-column-def";
import { useDeleteAiAgent } from "@/presentation/hook/ai-agent/use-delete-ai-agent";
import { useListAiAgents } from "@/presentation/hook/ai-agent/use-list-ai-agents";
import { useConfirmableAction } from "@/presentation/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/presentation/hook/use-copy-to-clipboard";

type AiAgentsTablePageProps = {
  initialData?: AiAgentDomain[];
};

export default function AiAgentsTablePage({
  initialData,
}: AiAgentsTablePageProps) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const deleteAction = useConfirmableAction();

  const { data, isPending } = useListAiAgents({ initialData });
  const { mutateAsync, isPending: isDeleteAiAgentPending } = useDeleteAiAgent();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteAiAgentActionTrigger = deleteAction.triggerAction;
  const handleDeleteAiAgentActionCancel = deleteAction.resetAction;
  const handleDeleteAiAgentActionConfirm = deleteAction.withConfirmableAction(
    async (id: AiAgentDomain["id"]) => {
      await mutateAsync({ params: { id } });
    },
  );

  return (
    <PlatformPageTemplate heading="AI Agent" isPending={isPending}>
      <div className="space-y-2.5">
        <div className="flex w-full justify-end">
          <Button
            nativeButton={false}
            render={(props) => (
              <Link href="/platform/ai-agent/new" {...props} />
            )}
          >
            <PlusIcon />
            New AI Agent
          </Button>
        </div>
        <DataTable
          columns={makeAiAgentsTableColumnDef({
            isDeleteConfirmationAlertOpen:
              deleteAction.step === "confirmation" ||
              deleteAction.step === "inProgress",
            isDeleting:
              deleteAction.step === "inProgress" || isDeleteAiAgentPending,
            onDeleteActionCancel: handleDeleteAiAgentActionCancel,
            onDeleteActionConfirm: handleDeleteAiAgentActionConfirm,
            onDeleteActionTrigger: handleDeleteAiAgentActionTrigger,
            onCopyAction: handleCopyAction,
          })}
          data={data ?? []}
          searchKey="name"
          searchPlaceholder="Filter AI agents..."
        />
      </div>
    </PlatformPageTemplate>
  );
}
