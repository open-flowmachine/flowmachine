"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/component/extended-ui/data-table";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { Button } from "@/component/ui/button";
import { Spinner } from "@/component/ui/spinner";
import { AiAgentTabs } from "@/feature/ai-agent-tabs/ai-agent-tabs";
import { makeAiAgentRunsTableColumnDef } from "@/feature/ai-agent-runs-table/ai-agent-runs-table-column-def";
import { useGetAiAgent } from "@/module/ai-agent/use-get-ai-agent";
import { isAiAgentRunTerminal } from "@/module/ai-agent-run/ai-agent-run-type";
import { useCreateAiAgentRun } from "@/module/ai-agent-run/use-create-ai-agent-run";
import { useListAiAgentRuns } from "@/module/ai-agent-run/use-list-ai-agent-runs";

type AiAgentRunsTablePageProps = {
  aiAgentId: string;
};

export function AiAgentRunsTablePage({ aiAgentId }: AiAgentRunsTablePageProps) {
  const router = useRouter();
  const { data: aiAgent } = useGetAiAgent(aiAgentId);
  const { data: runs, isPending } = useListAiAgentRuns(aiAgentId);
  const { mutateAsync: createRun, isPending: isCreatingRun } =
    useCreateAiAgentRun();

  const handleStartChat = async () => {
    const nonTerminalRun = runs?.find(
      (run) => !isAiAgentRunTerminal(run.status),
    );
    if (nonTerminalRun) {
      router.push(
        `/platform/ai-agent/${aiAgentId}/run/${nonTerminalRun.id}`,
      );
      return;
    }
    try {
      const result = await createRun({ params: { aiAgentId } });
      router.push(
        `/platform/ai-agent/${aiAgentId}/run/${result.data.runId}`,
      );
    } catch {
      toast.error("Failed to start a new chat");
    }
  };

  return (
    <PlatformPageTemplate
      heading={aiAgent?.name ?? "AI Agent"}
      isPending={isPending}
    >
      <div className="space-y-2.5">
        <AiAgentTabs aiAgentId={aiAgentId} />
        <div className="flex w-full justify-end">
          <Button onClick={handleStartChat} disabled={isCreatingRun}>
            {isCreatingRun ? <Spinner /> : <PlusIcon />}
            New chat
          </Button>
        </div>
        <DataTable
          columns={makeAiAgentRunsTableColumnDef({ aiAgentId })}
          data={runs ?? []}
        />
      </div>
    </PlatformPageTemplate>
  );
}
