"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DataTable } from "@/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { Button } from "@/component/ui/button";
import { makeAiAgentsTableColumnDef } from "@/feature/ai-agents-table/ai-agents-table-column-def";
import { useConfirmableAction } from "@/hook/use-confirmable-action";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";
import { useDeleteAiAgent } from "@/module/ai-agent/use-delete-ai-agent";
import { useListAiAgents } from "@/module/ai-agent/use-list-ai-agents";

export default function AiAgentsTablePage() {
  const [_, copyToClipboard] = useCopyToClipboard();
  const deleteAction = useConfirmableAction();

  const { data, isPending } = useListAiAgents();
  const { mutateAsync, isPending: isDeleteAiAgentPending } = useDeleteAiAgent();

  const handleCopyAction = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteAiAgentActionTrigger = deleteAction.triggerAction;
  const handleDeleteAiAgentActionCancel = deleteAction.resetAction;
  const handleDeleteAiAgentActionConfirm = deleteAction.withConfirmableAction(
    async (id: AiAgent["id"]) => {
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
